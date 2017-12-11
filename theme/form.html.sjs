module.exports = function( req, res, success, failure ){
	success( `<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>
<body>
<main>
    <form method="post" enctype="multipart/form-data">
        <label>
            <span>Say</span>
            <input type="text" name="say">
        </label>
        <label>
            <span>Other</span>
            <input type="text" name="other">
        </label>
        <label>
            <span>File</span>
            <input type="file" name="file">
        </label>
        <input type="submit">
    </form>
    <pre>${JSON.stringify( req.arguments.toJSON(), true, 4 )}</pre>
</main>
</body>
</html>` );
};