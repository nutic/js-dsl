Array.prototype.each = function(callback){
    for (var i=0; i < this.length; i++){
        callback(this[i], i);
    }
}

Array.prototype.skip = function(callback){
    var result = [];
    for (var i = 0; i < this.length; i++){
        if (callback(this[i]) == false){
            result.push(this[i]);
        }
    }
    return result;
}

Array.prototype.contains = function(element){
    for (var i=0; i < this.length; i++){
        if (this[i] == element){
            return true;
        }
    }
    
    return false;
}

function Chain(root){
    this.root = root;
    this.f = null;
    this.args = [];    
}

Chain.prototype = {
    argument: function(arg){
        this.args.push(arg)
    },
    
    current: function(){
        return this.root[this.f];
    },
    
    next: function(){
        if (this.f){
            this.root = this.current().apply(this.current(), this.args); 
        }
        this.f = null;
        this.args = [];
    },
    
    add: function(f){
        this.f = f;
    }
}

var defaultOptions = {
    ignore: ['given', 'when', 'than', 'and', 'a', 'the']
}

function isArgument(word){
    return word.match(/"[^"]*"/i);
}

function split(str){
    return str.match(/(\w+|"[^"]*")/ig);
}

function translate(batch, lang, options){
    options = options || {};
    ignore = options.ignore || defaultOptions.ignore;
    
    function translateString(str){
        var chain = new Chain(lang);
        split(str).skip(function(word){
            return ignore.contains(word);
        }).each(function(word){
            if (isArgument(word)){
                chain.argument(JSON.parse(word));
            } else {
                chain.next();
                chain.add(word);
            }
        });
        chain.next();
        return chain.root;
    }
    
    function merge(target, source){
        for (var prop in source){
            target[prop] = source[prop];
        }
    }
    
    function translateBatch(batch){
        var result = {};
        for (var prop in batch){
            if (batch[prop] == null){
                result[prop] = translateString(prop);
            } else {
                switch (typeof(batch[prop])){
                    case 'object':
                        result[prop] = {};
                        result[prop].topic = translateString(prop);

                        merge(result[prop], translateBatch(batch[prop]));
                        break;
                    default:
                        throw new Error('value should be of type object or null');
                }
            }
        }
        return result;
    }
    
    switch(typeof(batch)){
        case 'string':
            return translateString(batch);
        case 'object':
            return translateBatch(batch);                    
        default:
            throw new Error('batch parameter should be of type string or object');
    }
}

exports.translate = translate;