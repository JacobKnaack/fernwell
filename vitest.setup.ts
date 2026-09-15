// jsdom doesn't implement layout, so it has no scrollIntoView — combobox.ts's
// keyboard-highlight path calls it unconditionally, so stub it out here.
Element.prototype.scrollIntoView = function scrollIntoView() {};
