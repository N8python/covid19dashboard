function format(number, decPlaces = 2) {
    // 2 decimal places => 100, 3 => 1000, etc
    decPlaces = Math.pow(10, decPlaces);

    // Enumerate number abbreviations
    var abbrev = ["K", "M", "B", "T", "q", "Q", "s", "S", "O", "N", "D"];

    // Go through the array backwards, so we do the largest first
    for (var i = abbrev.length - 1; i >= 0; i--) {

        // Convert array index to "1000", "1000000", etc
        var size = Math.pow(10, (i + 1) * 3);

        // If the number is bigger or equal do the abbreviation
        if (size <= number) {
            // Here, we multiply by decPlaces, round, and then divide by decPlaces.
            // This gives us nice rounding to a particular decimal place.
            number = Math.round(number * decPlaces / size) / decPlaces;

            // Handle special case where we round up to the next abbreviation
            if ((number == 1000) && (i < abbrev.length - 1)) {
                number = 1;
                i++;
            }

            // Add the letter for the abbreviation
            number += abbrev[i];

            // We are done... stop
            break;
        }
    }

    return number;
}
const parseNum = function(s) {
    const pn = str => !(Object.is(Number(str), NaN)) ? Math.round(Number(str)) : Number(/([0-9\.]+)([A-Z])/.exec(str)[1]) * 10 ** ({
        "K": 3,
        "M": 6,
        "B": 9,
        "T": 12,
        "q": 15,
        "Q": 18,
        "s": 21,
        "S": 24,
        "O": 27,
        "N": 30,
        "D": 33
    })[/([0-9\.]+)([A-Z])/.exec(str)[2]];
    try {
        return pn(s);
    } catch (e) {
        addMessage("Invalid input!");
        return 0;
    }
};