// Keep every record readable before JavaScript loads; filtering is optional.
(function () {
    'use strict';
    const controls = document.getElementById('year-filter');
    const years = Array.from(document.querySelectorAll('.award-year'));
    const count = document.getElementById('award-count');
    document.querySelectorAll('a[href^="#source-"]').forEach(function (link) {
        link.addEventListener('click', function () {
            document.querySelector('#sources details').open = true;
        });
    });
    controls.hidden = false;
    controls.addEventListener('click', function (event) {
        const button = event.target.closest('button[data-year]');
        if (!button) return;
        const selected = button.dataset.year;
        controls.querySelectorAll('button').forEach(function (item) {
            item.setAttribute('aria-pressed', String(item === button));
        });
        let visible = 0;
        years.forEach(function (group) {
            group.hidden = selected !== 'all' && group.dataset.year !== selected;
            if (!group.hidden) visible += group.querySelectorAll('.award').length;
        });
        count.textContent = (selected === 'all' ? '全部年份' : selected + ' 年') + ' · ' + visible + ' 项记录';
    });
})();
