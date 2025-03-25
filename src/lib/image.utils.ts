export async function processProfilePicture(file: File): Promise<[url: string, file: File]> {
	const url = await readFile(file);

	const image = await getImage(url);

	const dataUrl = convertImage(image);
	const blob = await (await fetch(dataUrl)).blob();

	const filename = file.name.split('.').slice(0, -1).concat('jpg').join('.');
	return [dataUrl, new File([blob], filename, { type: 'image/jpeg' })];
}

async function readFile(file: File) {
	const { promise, resolve, reject } = Promise.withResolvers<string>();

	const reader = new FileReader();
	reader.addEventListener('load', () => {
		if (typeof reader.result === 'string') resolve(reader.result);
		else reject(new Error('Invalid file'));
	});
	reader.addEventListener('error', () => reject(new Error('Invalid file')));
	reader.readAsDataURL(file);

	return promise;
}

function getImage(url: string) {
	const { promise, resolve, reject } = Promise.withResolvers<HTMLImageElement>();
	const image = new Image();

	image.addEventListener('load', () => resolve(image));
	image.addEventListener('error', () => reject(new Error('Invalid image')));

	image.src = url;
	return promise;
}

const DIMENSION_MAX = 600;

function convertImage(image: HTMLImageElement) {
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('2d');
	if (!context) throw new Error('Something went wrong');

	const ratio = Math.min(DIMENSION_MAX / image.width, DIMENSION_MAX / image.height);
	if (ratio < 1) {
		canvas.width = Math.floor(image.width * ratio);
		canvas.height = Math.floor(image.height * ratio);
	} else {
		canvas.width = image.width;
		canvas.height = image.height;
	}

	context.drawImage(image, 0, 0, canvas.width, canvas.height);
	return canvas.toDataURL('image/jpeg', 0.8);
}
