document.addEventListener("DOMContentLoaded", () => {
  const pages = document.querySelectorAll(".page");
  const navLinks = document.querySelectorAll(".nav-link");

  function navigate() {
    let hash = window.location.hash || "#home";

    pages.forEach((page) => {
      page.classList.remove("active");
    });

    const activePage = document.querySelector(hash);
    if (activePage) {
      activePage.classList.add("active");
    } else {
      document.querySelector("#home").classList.add("active");
    }

    navLinks.forEach((link) => {
      if (link.getAttribute("href") === hash) {
        link.classList.add("text-white", "font-bold");
        link.classList.remove("text-gray-300");
      } else {
        link.classList.remove("text-white", "font-bold");
        link.classList.add("text-gray-300");
      }
    });
  }

  window.addEventListener("hashchange", navigate);

  navigate();
});
