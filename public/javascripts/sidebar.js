$(document).ready(function () {
const currentPath = window.location.pathname;

$('.app-sidebar__link').each(function(){
    if ($(this).attr('href') === currentPath) {
        $(this).addClass('active');
    }

});

});