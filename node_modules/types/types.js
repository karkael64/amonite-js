function is_boolean( el ) {
	return typeof el === 'boolean';
}

function is_function( el ) {
	return typeof el === 'function';
}

function is_list( el ) {
	return is_object( el ) && ( el instanceof Array );
}

function is_null( el ) {
	return el === null;
}

function is_number( el ) {
	return typeof el === 'number';
}

function is_object( el ) {
	return ( typeof el === 'object' ) && ( el !== null );
}

function is_string( el ) {
	return typeof el === 'string';
}

function is_symbol( el ) {
	return typeof el === 'symbol';
}

function is_undefined( el ) {
	return el === undefined;
}

module.exports = {
	'is_boolean': is_boolean,
	'is_function': is_function,
	'is_list': is_list,
	'is_null': is_null,
	'is_number': is_number,
	'is_object': is_object,
	'is_string': is_string,
	'is_symbol': is_symbol,
	'is_undefined': is_undefined
};