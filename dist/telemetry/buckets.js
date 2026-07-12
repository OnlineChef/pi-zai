export function bucketCount(value, edges) {
    for (let i = 0; i < edges.length - 1; i += 1) {
        const low = edges[i];
        const high = edges[i + 1];
        const isLastBucket = i === edges.length - 2;
        if (value >= low && (isLastBucket ? value <= high : value < high)) {
            return `${low}-${high}`;
        }
    }
    return `${edges.at(-1)}+`;
}
//# sourceMappingURL=buckets.js.map