
function finxJSNamespace() {
        // Use jQuery to have sidebar toggle
        function initSidebarToggle() {
                $(document).ready(
                    function () {
                        $('#sidebarCollapse').on('click', function () {$('#sidebar').toggleClass('toggled');});
                });
        }

        function init() {
                initSidebarToggle();
        }

        return { init: init }
}

var finxJS = finxJSNamespace();