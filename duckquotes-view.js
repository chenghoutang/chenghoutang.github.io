(function (root) {
    'use strict';

    // Parse the recorded calendar time without browser-specific Date.parse rules.
    function parseDate(time) {
        var match = String(time || '').trim().match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
        if (!match) return null;
        var parts = match.slice(1).map(function (part) { return Number(part || 0); });
        var year = parts[0], month = parts[1], day = parts[2];
        var leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
        var days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        if (year < 1 || month < 1 || month > 12 || day < 1 || day > days[month - 1] ||
            parts[3] > 23 || parts[4] > 59 || parts[5] > 59) return null;
        return {
            year: year,
            month: month,
            key: parts.reduce(function (key, part) { return key * 100 + part; }, 0)
        };
    }

    function entries(quotes) {
        return quotes.map(function (quote, index) {
            return { quote: quote, index: index, date: parseDate(quote.time) };
        });
    }

    function years(items) {
        return Array.from(new Set(items.filter(function (item) { return item.date; })
            .map(function (item) { return item.date.year; }))).sort(function (a, b) { return b - a; });
    }

    function months(items, year) {
        return Array.from(new Set(items.filter(function (item) {
            return item.date && (!year || item.date.year === year);
        }).map(function (item) { return item.date.month; }))).sort(function (a, b) { return a - b; });
    }

    function select(items, filters) {
        var query = (filters.query || '').trim().toLowerCase();
        var direction = filters.descending === false ? 1 : -1;
        return items.filter(function (item) {
            return (!query || String(item.quote.content || '').toLowerCase().includes(query)) &&
                (!filters.year || (item.date && item.date.year === filters.year)) &&
                (!filters.month || (item.date && item.date.month === filters.month));
        }).sort(function (a, b) {
            // Undated entries remain accessible, after dated entries in both orders.
            if (!a.date && b.date) return 1;
            if (a.date && !b.date) return -1;
            return direction * ((a.date && b.date ? a.date.key - b.date.key : 0) || a.index - b.index);
        });
    }

    var api = { parseDate: parseDate, entries: entries, years: years, months: months, select: select };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.DuckQuotesView = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
