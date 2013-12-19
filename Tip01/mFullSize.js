window.mFullSize = (function() {
    var getSize = function() {
        if (!this._fullSizeCheckElement) {
            this._fullSizeCheckElement = document.createElement("div");
            document.body.appendChild(this._fullSizeCheckElement);
        }
        this._fullSizeCheckElement.style.cssText = 'position:absolute; top: 0px; width:100%;height:' + parseInt(window.innerHeight + 200, 10) + 'px;';
        window.scrollTo(0, 1);
        var self = this;
        setTimeout(function() {
            _checkSize();
        }, 500);
    }, 
    _checkSize = function() {
        var htSize = {
            "width" : window.innerWidth,
            "height" : window.innerHeight
        }
        this._fullSizeCheckElement.style.height = "0px";
        fCallback(htSize);
    };
    function mFullSize(fCallback) {
        getSize();
    };

    return mFullSize;
})(); 