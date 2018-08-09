const crypto = require( 'crypto' );
const type = require( 'types' );

const mimes = {
	"application": {
		"js": "application/javascript",
		"xhtml": "application/xhtml+xml",
		"swf": "application/x-shockwave-flash",
		"json": "application/json",
		"zip": "application/zip",
		"pdf": "application/pdf",
		"ogg": "application/ogg"
	},
	"audio": {
		"mp3": "audio/mpeg",
		"wma": "audio/x-ms-wma",
		"ra": "audio/vnd.rn-realaudio",
		"rm": "audio/vnd.rn-realaudio",
		"smil": "audio/vnd.rn-realaudio",
		"ram": "audio/vnd.rn-realaudio",
		"rmvb": "audio/vnd.rn-realaudio",
		"rv": "audio/vnd.rn-realaudio",
		"wav": "audio/x-wav",
		"oga": "audio/ogg"
	},
	"image": {
		"gif": "image/gif",
		"jpg": "image/jpeg",
		"jpeg": "image/jpeg",
		"png": "image/png",
		"tiff": "image/tiff",
		"ico": "image/vnd.microsoft.icon",
		"djv": "image/vnd.djvu",
		"djvu": "image/vnd.djvu",
		"svg": "image/svg+xml"
	},
	"video": {
		"mpg": "video/mpeg",
		"mpeg": "video/mpeg",
		"mp4": "video/mp4",
		"mov": "video/quicktime",
		"wmv": "video/x-ms-wmv",
		"avi": "video/x-msvideo",
		"flv": "video/x-flv",
		"webm": "video/webm",
		"ogv": "video/ogg"
	},
	"text": {
		"css": "text/css",
		"csv": "text/csv",
		"htm": "text/html",
		"html": "text/html",
		"phtml": "text/html",
		"txt": "text/plain",
		"xml": "application/xml"
	},
	"opendocument": {
		"odt": "application/vnd.oasis.opendocument.text",
		"ods": "application/vnd.oasis.opendocument.spreadsheet",
		"odp": "application/vnd.oasis.opendocument.presentation",
		"odg": "application/vnd.oasis.opendocument.graphics",
		"odc": "application/vnd.oasis.opendocument.chart",
		"odf": "application/vnd.oasis.opendocument.formula",
		"odb": "application/vnd.oasis.opendocument.database",
		"odi": "application/vnd.oasis.opendocument.image",
		"odm": "application/vnd.oasis.opendocument.text-master"
	},
	"microsoft": {
		"doc": "application/msword",
		"dot": "application/msword",
		"docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		"dotx": "application/vnd.openxmlformats-officedocument.wordprocessingml.template",
		"docm": "application/vnd.ms-word.document.macroEnabled.12",
		"dotm": "application/vnd.ms-word.template.macroEnabled.12",

		"xls": "application/vnd.ms-excel",
		"xlt": "application/vnd.ms-excel",
		"xla": "application/vnd.ms-excel",
		"xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		"xltx": "application/vnd.openxmlformats-officedocument.spreadsheetml.template",
		"xlsm": "application/vnd.ms-excel.sheet.macroEnabled.12",
		"xltm": "application/vnd.ms-excel.template.macroEnabled.12",
		"xlam": "application/vnd.ms-excel.addin.macroEnabled.12",
		"xlsb": "application/vnd.ms-excel.sheet.binary.macroEnabled.12",

		"ppt": "application/vnd.ms-powerpoint",
		"pot": "application/vnd.ms-powerpoint",
		"pps": "application/vnd.ms-powerpoint",
		"ppa": "application/vnd.ms-powerpoint",
		"pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
		"potx": "application/vnd.openxmlformats-officedocument.presentationml.template",
		"ppsx": "application/vnd.openxmlformats-officedocument.presentationml.slideshow",
		"potm": "application/vnd.ms-powerpoint.template.macroEnabled.12",
		"ppam": "application/vnd.ms-powerpoint.addin.macroEnabled.12",
		"pptm": "application/vnd.ms-powerpoint.presentation.macroEnabled.12",
		"ppsm": "application/vnd.ms-powerpoint.slideshow.macroEnabled.12"

	}
};

/**
 * @function getFilenameMime split a filename and read at the extension at the end. Search in const ${mime} the
 * corresponding mime.
 * @param filename string
 * @returns {*}
 */

function getFilenameMime( filename ) {
	let t;
	if( type.is_string( filename ) && ( t = filename.match( /\w+$/ ) ) && ( t = t[ 0 ] ) )
		for( let m in mimes ) {
			let mime = mimes[ m ];
			if( mime[ t ] ) return mime[ t ];
		}
	return "text/plain";
}

/**
 * @function bodyEtag hash the body
 * @param body
 * @returns {*}
 */

function bodyEtag( body ) {
	let hash = crypto.createHash( 'sha1' );
	hash.update( body );
	return hash.digest( 'hex' );
}

/**
 * @class Controller is a class which is used to create some content, and which can be send and read by the motor. This
 * class is here an abstract class, please create a child class with a getContent method
 */

class Content {

	/**
	 * @warn This class can't be instanciated as if, a child class should have getContent as a method.
	 * getContent function( Http.IncomingMessage req, Http.ServerResponse res, function next( err, body ) )
	 */

	constructor() {
		if( !type.is_function( this.getContent ) )
			throw new Error( "This instance of Content has no getContent function!" );
	}
}

Content.getFilenameMime = getFilenameMime;
Content.bodyEtag = bodyEtag;

module.exports = Content;