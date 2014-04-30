A custom console replacement for logging. Simply enable and use the console as you would normally, but now with additional details that can aid debugging.

To use:

```javascript
var enhance = require('node-console-enhance');
enhance.enable('My custom script name');
```

To customize:

```javascript
var enhance = require('node-console-enhance');
enhance.token('custom', 'This is my custom token value');
enhance.format('[{date}] - {custom} - {parameters}');
// I only want to see warnings and errors
enhance.enable('My custom script name', 'warn');
```
