const postcss = require("postcss");
// const postcssPresetEnv = require('postcss-preset-env');
const postcssPluginFlatNode = require("./postcssPluginFlatNode")
const postcssFor = require("./postcssFor")
const postcssPluginFunctional = require("./postcssPluginFunctional");

const code = `
.a {
    @include good(888);
}
@function good(value){
    @let v = value;
    @if(v < 50){
        @return "padding-top:50px";
    }
    @return "padding-bottom:" + v+  "px";
}
`
postcss([
    postcssPluginFunctional,
]).process(code, { from: "", to: "" })
    .then(result => {
        console.log(result.css);
    })
