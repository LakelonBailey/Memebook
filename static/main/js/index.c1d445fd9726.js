$(document).ready(function() {
    window.LOAD_SECTION = function(section, data={}) {
        if (section != window.CURRENT_SECTION) {
            // Remove the active classes from the current step.
            $('section.tab.active').removeClass('active');
            $(`.section-load`).removeClass('active');

            // Add active classes to the newly current step.
            $(`section.tab[data-section="${section}"]`).addClass('active');
            $('title').text(`${$(`section.tab[data-section="${section}"] h2.sec-title`).text()} | Memebook`)
            $(`.menu-list a[data-section="${section}"]`).addClass('active');

            // Scroll to the top.
            $('#sections').scrollTop(0);

            window.CURRENT_SECTION = section;
            localStorage.setItem('section', window.CURRENT_SECTION);

            window.LOAD_SECTION_DATA(data);
        }

    }
    window.LOAD_SECTION_DATA = async (data) => {
        const section = window.CURRENT_SECTION;
        if (section == 'create-meme') {
            await loadCreateMeme();
        }

        localStorage.setItem(
            'sectionData',
            JSON.stringify(data)
        );
    }

    // Handle section link click
    $(document).on('click', 'a.section-load', function() {
        const {section, ...data} = $(this).data();
        window.LOAD_SECTION(section || 'create-meme', data);
    })

    // Handle backend-established first page
    if (window.FIRST_PAGE) {
        const disabledPages = {};
        const currentDisables = disabledPages[window.FIRST_PAGE] || null;

        if (currentDisables != null) {
            if (currentDisables == 'ALL') {
                $(`.menu-list a`).addClass('is-disabled');
            }
            else {
                for (let page of currentDisables) {
                    $(`.menu-list a[data-section="${page}"]`).hide();
                }
            }
        }

        window.LOAD_SECTION(window.FIRST_PAGE);
        return;
    }

    let section = localStorage.getItem('section') || 'create-meme';
    const sectionData = JSON.parse(localStorage.getItem('sectionData') || "{}");
    window.LOAD_SECTION(section, sectionData);
})