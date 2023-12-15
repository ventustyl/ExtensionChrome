document.addEventListener("DOMContentLoaded", function () {
  // Récupérer les onglets actifs
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    // Envoyer un message au content script pour récupérer les contenus des balises et la description
    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        function: getHeadingsAndDescription,
      },
      displayHeadingsAndDescription
    );

    // Appel à getImageCount pour compter les images
    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        function: getImageCount,
      },
      displayImageCount // Affiche le nombre d'images après avoir compté
    );

    // Envoyer un message au content script pour récupérer les images et leurs balises alt
    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        function: getImageInfo,
      },
      displayImageInfo
    );
  });
});

function getHeadingsAndDescription() {
  const headings = document.querySelectorAll("h1, h2, h3, h4, h5");
  const headingData = Array.from(headings).map((heading) => {
    return {
      tag: heading.tagName.toLowerCase(),
      content: heading.textContent,
    };
  });

  const metaDescription = document.querySelector('meta[name="description"]');
  const descriptionContent = metaDescription ? metaDescription.content : null;

  const pageTitle = document.title;

  // Récupérer le nom de domaine de la page actuelle
  const currentDomain = new URL(window.location.href).hostname;

  // Compter les liens
  const links = document.querySelectorAll("a");

  let outgoingLinksCount = 0;
  let internalLinksCount = 0;

  links.forEach((link) => {
    const href = link.href;
    if (href.startsWith("http")) {
      const linkDomain = new URL(href).hostname;
      if (linkDomain === currentDomain) {
        internalLinksCount++;
      } else {
        outgoingLinksCount++;
      }
    }
  });

  return {
    headingData: headingData,
    descriptionContent: descriptionContent,
    pageTitle: pageTitle,
    outgoingLinksCount: outgoingLinksCount,
    internalLinksCount: internalLinksCount,
  };
}
function displayHeadingsAndDescription(results) {
  const headingList = document.getElementById("headingList");
  const descriptionDiv = document.getElementById("description");
  const pageTitleDiv = document.getElementById("pageTitle");
  const outgoingLinksDiv = document.getElementById("outgoingLinks");
  const internalLinksDiv = document.getElementById("internalLinks");

  if (results && results.length > 0) {
    const response = results[0].result;

    // Compter le nombre de balises <h1>
    const h1Count = response.headingData.filter(
      (data) => data.tag === "h1"
    ).length;

    // Vérifier et afficher un avertissement si aucune balise H1 n'est trouvée
    if (h1Count === 0) {
      headingList.innerHTML =
        "<li style='height: 23px; margin: 5px auto; ' ><strong><span style='color: white; background:red; padding:5px;'>" +
        "h1" +
        "</span></strong>: (Attention il n'y a pas de H1)</li>";
    }

    // Afficher toutes les balises de titre
    response.headingData.forEach(function (data) {
      if (data.tag === "h1" && h1Count > 1) {
        // Si plusieurs balises H1 sont présentes, afficher en rouge
        headingList.innerHTML +=
          "<li style='height: 23px; margin:5px auto; ' ><strong><span style='color: white; background:red; padding:5px; '>" +
          data.tag +
          "</span></strong>: " +
          data.content +
          " (Attention il y a plusieurs H1)</li>";
      } else {
        // Afficher les balises de titre
        headingList.innerHTML +=
          "<li style='height: 23px; margin: 5px auto; '><strong><span style='color: white; background:" +
          (data.tag === "h1" ? "green" : "black") +
          "; padding:5px;  '>" +
          data.tag +
          "</span></strong>: " +
          data.content +
          "</li>";
      }
    });
    if (h1Count > 0 || response.headingData.length > 0) {
      headingList.innerHTML += "</ul>";
    }

    // Afficher le nombre de liens sortants
    if (response && response.outgoingLinksCount) {
      outgoingLinksDiv.textContent =
        "Nombre de liens sortants: " + response.outgoingLinksCount;
    } else {
      outgoingLinksDiv.textContent = "Aucun lien sortant trouvé.";
      outgoingLinksDiv.style.color = "red";
    }

    // Afficher le nombre de liens internes
    if (response && response.internalLinksCount) {
      internalLinksDiv.textContent =
        "Nombre de liens internes: " + response.internalLinksCount;
    } else {
      internalLinksDiv.textContent = "Aucun lien interne trouvé.";
      internalLinksDiv.style.color = "red";
    }

    // Afficher la description de la page
    if (response && response.descriptionContent) {
      descriptionDiv.textContent =
        "Description: " + response.descriptionContent;
      // Vérification de la longueur de la méta-description
      if (response.descriptionContent.length > 160) {
        descriptionDiv.style.color = "red";
      } else if (response.descriptionContent.length < 160) {
        descriptionDiv.style.color = "green";
      }
    } else {
      descriptionDiv.textContent =
        "Aucune balise <meta name='description'> trouvée.";
      descriptionDiv.style.color = "red";
    }

    // Afficher le titre de la page
    if (response && response.pageTitle) {
      pageTitleDiv.textContent = "Titre de la page: " + response.pageTitle;
      // Vérification de la longueur du titre de la page
      if (response.pageTitle.length > 60) {
        pageTitleDiv.style.color = "red";
      } else if (response.pageTitle.length < 60) {
        pageTitleDiv.style.color = "green";
      }
    } else {
      pageTitleDiv.textContent = "Aucun titre de page trouvé.";
      pageTitleDiv.style.color = "red";
    }
  } else {
    // Gérer le cas où results est vide ou indéfini
    headingList.textContent = "Aucune donnée disponible pour les titres.";
    descriptionDiv.textContent =
      "Aucune donnée disponible pour la description.";
    pageTitleDiv.textContent =
      "Aucune donnée disponible pour le titre de la page.";
    outgoingLinksDiv.textContent = "Aucun lien sortant trouvé.";
    internalLinksDiv.textContent = "Aucun lien interne trouvé.";
    outgoingLinksDiv.style.color = "red";
  }
}

// Fonction pour compter le nombre d'images sur la page
function getImageCount() {
  const images = document.querySelectorAll("img");
  const imageCount = images.length;

  return {
    imageCount: imageCount,
  };
}

// Fonction pour afficher le nombre d'images sur la page
function displayImageCount(results) {
  const imageCountDiv = document.getElementById("imageCount");

  if (results && results.length > 0 && results[0].result) {
    const imageCountResponse = results[0].result;

    if (imageCountResponse && imageCountResponse.imageCount) {
      imageCountDiv.textContent =
        "Nombre d'images sur la page: " + imageCountResponse.imageCount;
    } else {
      imageCountDiv.textContent = "Aucune image trouvée sur la page.";
      imageCountDiv.style.color = "red";
    }
  } else {
    // Gérer le cas où results est vide, indéfini ou ne contient pas de résultat
    imageCountDiv.textContent = "Aucune donnée disponible";
  }
}

function getImageInfo() {
  const images = document.querySelectorAll("img");
  const imageInfo = Array.from(images).map((img) => {
    return {
      src: img.src,
      alt: img.alt,
    };
  });

  return {
    imageInfo: imageInfo,
  };
}

function displayImageInfo(results) {
  const imageList = document.getElementById("imageList");

  if (results && results.length > 0 && results[0].result) {
    const imageInfoResponse = results[0].result;

    if (
      imageInfoResponse &&
      imageInfoResponse.imageInfo &&
      imageInfoResponse.imageInfo.length > 0
    ) {
      imageList.innerHTML = "";

      imageInfoResponse.imageInfo.forEach(function (image) {
        const imageThumbnail = document.createElement("img");
        imageThumbnail.src = image.src;
        imageThumbnail.width = 30;
        imageThumbnail.height = 30;
        imageThumbnail.style.objectFit = "scale-down";

        const listItem = document.createElement("div");
        listItem.className = "image-item";

        if (image.alt.trim() !== "") {
          // Si l'image a une balise alt, cadre vert
          imageThumbnail.style.border = "2px solid green";
        } else {
          // Si l'image n'a pas de balise alt, cadre rouge
          imageThumbnail.style.border = "2px solid red";
        }

        listItem.appendChild(imageThumbnail);
        imageList.appendChild(listItem);
      });
    } else {
      imageList.textContent = "Aucune image trouvée sur la page.";
      imageList.style.color = "red";
    }
  } else {
    // Gérer le cas où results est vide, indéfini ou ne contient pas de résultat
    imageList.textContent = "Aucune donnée disponible";
    imageList.style.color = "red";
  }
}
