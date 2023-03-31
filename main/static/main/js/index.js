$(document).ready(function() {
    window.LOAD_SECTION = async function(section, data={}) {
        if (section != window.CURRENT_SECTION) {
            // Remove the active classes from the current step.
            $('section.tab.active').removeClass('active');
            $(`.section-load`).removeClass('active');

            // Scroll to the top.
            $('#sections').scrollTop(0);

            window.CURRENT_SECTION = section;
            $(`section.tab[data-section="loader-view"]`).addClass('active');
            await window.LOAD_SECTION_DATA(data);
            $(`section.tab[data-section="loader-view"]`).removeClass('active');
            $(`section.tab[data-section="${section}"]`).addClass('active');
            localStorage.setItem('section', window.CURRENT_SECTION);

        }

    }
    window.LOAD_SECTION_DATA = async (data) => {
        const section = window.CURRENT_SECTION;
        if (section == 'create-meme') {
            await loadCreateMeme();
        }
        else if (section == 'profile') {
            await loadProfile();
        }
        else if (section == 'view-meme') {
            const memeUUID = data.meme_uuid;
            if (memeUUID == undefined) {
                window.LOAD_SECTION('profile');
                return;
            }
            await loadViewMeme(memeUUID);
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
    const mainSection = 'profile';
    let section = localStorage.getItem('section') || mainSection;
    const hiddenSections = ['loader-view'];
    section = hiddenSections.includes(section) ? mainSection : section;
    const sectionData = JSON.parse(localStorage.getItem('sectionData') || "{}");
    window.LOAD_SECTION(section, sectionData);
})