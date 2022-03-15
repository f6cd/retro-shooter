// Stolen from: https://stackoverflow.com/a/5915122.
/**
 * Get random in array.
 * @template T
 * @param {Array.<T>} arr 
 * @returns {T}
 */
export default function getRandomInArray(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}