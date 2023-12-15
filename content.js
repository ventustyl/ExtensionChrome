chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "getHeadingsAndDescription") {
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

    sendResponse({
      headingData: headingData,
      descriptionContent: descriptionContent,
      pageTitle: pageTitle,
    });
  }
});
