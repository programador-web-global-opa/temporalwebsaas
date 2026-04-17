$(document).ready(function () {
  const currentPath = window.location.pathname;

  $('.app-sidebar__link').each(function () {
    if ($(this).attr('href') === currentPath) {
      $(this).addClass('active');
    }
  });

  $('#logout-form').on('submit', async function (e) {
    e.preventDefault();

    window.__cerrandoSesion = true;

    localStorage.clear();
    sessionStorage.clear();

    if (indexedDB.databases) {
      const dbs = await indexedDB.databases();
      await Promise.all(dbs.map(db => new Promise(resolve => {
        const req = indexedDB.deleteDatabase(db.name);
        req.onsuccess = resolve;
        req.onerror = resolve;
      })));
    }

    this.submit();
  });
});