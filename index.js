const gutil = require('gulp-util');
const through = require('through2');


const reg={
  fastweb: /(@fastweb\/)([^"']+)/g,
  importAs: /import\s+\*\s+as\s+(.*)\s+from\s+["'](.*)["']/g,
  import: /import\s+(.+)\s+from\s+["'](.*)["']/g,
  importOne: /import\s*{(.*)}\s*from\s+["'](.*)["']/g,
  exportFun: /export\s+function\s+([^(\s]+)/g,
  exportVar: /export\s+(const|let|var)\s+([^=\s]+)/g,
  exportDef: /(export\s+default)|(export\s+(?={))/g
};

function exportFun2export(str){
  return str.replace(reg.exportFun,function($,$1){
    return `export.${$1} = function `;
  });
}
function exportDef2module(str){
  return str.replace(reg.exportDef,function(){
    return `module.exports = `;
  });
}
function exportVar2export(str){
  return str.replace(reg.exportVar,function($,$1,$2){
    return `export.${$2} `;
  });
}

function fastwebAddCommon(str){
  return str.replace(reg.fastweb,function($,$1,$2){
    return $+'_common';
  });
}

function importAs2require(str){
  return str.replace(reg.importAs,function($,$1,$2){
    return `const ${$1} =require("${$2}")`;
  });
}

function import2require(str){
  return str.replace(reg.import,function($,$1,$2){
    return `const ${$1} =require("${$2}")`;
  });
}

function importOne2require(str){
  let ones="";
  let name='';
  str=str.replace(reg.importOne,function($,$1,$2){
    ones=$1.split(",");
    name=$2.replace(/[^a-zA-Z0-9_$-]+/g,'');
    return `const ${name} =require("${$2}")`;
  });

  for(let i in ones){
    let re=new RegExp(ones[i],"g");
    str=str.replace(re,name+"."+ones[i]);
  }

  return str;
}




module.exports = opts => {
  return through.obj(function(file, enc, cb){
    if (file.isNull()) {
      cb(null, file);
      return;
    }

    if (file.isStream()) {
      cb(new gutil.PluginError('gulp-esm2common', 'Streaming not supported'));
    }

    let contents=file.contents.toString();
    contents=importAs2require(contents);
    contents=import2require(contents);
    contents=importOne2require(contents);
    contents=fastwebAddCommon(contents);
    contents=exportFun2export(contents);
    contents=exportDef2module(contents);
    contents=exportVar2export(contents);

    file.contents = Buffer.from(contents,'UTF-8');
    this.push(file);
    cb();
  });
};
