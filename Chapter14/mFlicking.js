window.mFlicking = (function() {
    var _htElement = [], 
    _htOption = {
        container : "flickContainer",
        childnode : "flick-panel"
    }, 
    nContainerWidth = 0, 
    nTouchStartX = 0, // touchstart의 X 좌표
    nTouchStartY = 0, // touchStart의 Y 좌표
    nTouchX = 0, // touchmove, touchend의 X 좌표
    nTouchY = 0, // touchmove, touchend의 Y 좌표
    nIndex = 0, // 화면에 보이는 요소의 인덱스
    nTimeout = 0;

    var _attachTouchStart = function() {
        jindo.$Fn(function(event){
            _clearAnchor();
            var touch = event._event.touches[0];
            nTouchStartX = touch.pageX;
            // X 좌표
            nTouchStartY = touch.pageY;
            // Y 좌표
        }).attach(_htElement["elFlick"], "touchstart");
    };

    var _setElement = function(sId) {
        _htElement["elFlick"] = jindo.$(sId);
        _htElement["elContainer"] = jindo.$(_htOption.container);
        _htElement["aChildNodes"] = jindo.$$("." + _htOption.childnode, _htElement["elContainer"]);

        nContainerWidth = _htElement["elContainer"].offsetWidth;
    };

    var _attachTouchMove = function() {
        jindo.$Fn(function(event){
            event.stop();

            var touch = event._event.touches[0];
            nTouchX = touch.pageX;
            // X 좌표
            nTouchY = touch.pageY;
            // Y 좌표

            var nValue = nTouchX - nTouchStartX;
            if (nIndex <= 0 && nValue > 0 || nIndex >= 2 && nValue < 0) {
                return false;
            } else {
                _htElement["elContainer"].style.webkitTransform = "translate(" + nValue + "px)";
            }
        }).attach(_htElement["elFlick"], "touchmove");
        
    };

    var _attachTouchEnd = function() {
        var self = this;
        
        jindo.$Fn(function(event){
            var touch = event._event.changedTouches[0];
            nTouchX = touch.pageX;
            // X 좌표
            nTouchY = touch.pageY;
            // Y 좌표

            var nTranslate = nContainerWidth;
            var nTmpIndex = nIndex;

            if (nTouchStartX - nTouchX == 0) {
                _restoreAnchor();
                _setAnchorElement();
                return false;
            }
            if (nTouchStartX - nTouchX > 0) {
                nIndex++;
                nTranslate = nContainerWidth * -1;
            } else {
                nIndex--;
            }

            if (nIndex >= 0 && nIndex <= 2) {
                nTimeout = setTimeout(function() {
                    _setPosition();
                    _htElement["elContainer"].style.webkitTransform = "translate(0)";
                    _htElement["elContainer"].style.webkitTransition = null;
                }, 200);
                _htElement["elContainer"].style.webkitTransition = "all 0.2s ease-out";
                _htElement["elContainer"].style.webkitTransform = "translate(" + nTranslate + "px)";
            } else {
                nIndex = nTmpIndex;
            }
        }).attach(_htElement["elFlick"], "touchend");
        
    };

    var _setPosition = function() {
        var nCenterIndex = nIndex % 3;
        var nRightIndex = nCenterIndex + 1;
        var nLeftIndex = nCenterIndex - 1;
        if (nCenterIndex - 1 < 0) {
            nLeftIndex = 2;
        }
        if (nCenterIndex + 1 > 2) {
            nRightIndex = 0;

        }
        _htElement["aChildNodes"][nLeftIndex].style.left = "-100%";
        _htElement["aChildNodes"][nCenterIndex].style.left = "0%";
        _htElement["aChildNodes"][nRightIndex].style.left = "100%";

    };

    var _setAnchorElement = function() {
        if (jindo.$Agent().os().ios) {
            this._aAnchor = jindo.$$("A", _htElement["elContainer"]);
        }
    }
    var _clearAnchor = function() {
        if (this._bBlocked || !this._aAnchor) {
            return false;
        }
        this._fnDummyFnc = function() {
            return false;
        };
        for (var i = 0, nLen = this._aAnchor.length; i < nLen; i++) {
            if (this._fnDummyFnc !== this._aAnchor[i].onclick) {
                this._aAnchor[i]._onclick = this._aAnchor[i].onclick;
            }
            this._aAnchor[i].onclick = this._fnDummyFnc;
        }
        this._bBlocked = true;
    }
    var _restoreAnchor = function() {
        if (!this._bBlocked || !this._aAnchor) {
            return false;
        }

        for (var i = 0, nLen = this._aAnchor.length; i < nLen; i++) {
            if (this._fnDummyFnc !== this._aAnchor[i]._onclick) {
                this._aAnchor[i].onclick = this._aAnchor[i]._onclick;
            } else {
                this._aAnchor[i].onclick = null;
            }
        }
        this._bBlocked = false;
    }
    function mFlicking(sId, htOption) {

        htOption = htOption || {};
        for (var property in htOption) {
            _htOption[property] = htOption[property];
        }
        _setElement(sId);
        _setAnchorElement();
        _attachTouchStart();
        _attachTouchMove();
        _attachTouchEnd();
    };

    return mFlicking;
})(); 