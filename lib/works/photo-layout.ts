type Dimensions = { width: number; height: number };

export function groupAlbumPhotos<T extends Dimensions>(photos: T[], containerWidth: number, targetRowHeight = 380): T[][] {
  const groups: T[][] = [];
  let row: T[] = [];
  for (const photo of photos) {
    const fillsRow = containerWidth >= 640 &&
      photo.width / photo.height * targetRowHeight + 40 + Math.min(240, containerWidth / 3) > containerWidth;
    if (fillsRow) {
      if (row.length) groups.push(row);
      groups.push([photo]);
      row = [];
    } else {
      row.push(photo);
    }
  }
  if (row.length) groups.push(row);
  return groups;
}
