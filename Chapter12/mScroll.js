window.mScroll = (function() {
    // private memeber
    var _htWElement = {}, 
    _htEvent = {}, 
    _htOption = {
        nWidth : "0px",
        nHeight : "0px",
        bUseHScroll : false,
        bUseVScroll : true
    }, 
    _sPrefix = m.getPrefix(), 
    _nMaxScrollLeft = 0, 
    _nMaxScrollTop = 0, 
    _bUseHScroll = _htOption["bUseHScroll"], 
    _bUseVScroll = _htOption["bUseVScroll"], 
    _nTop = 0, 
    _nLeft = 0, 
    _nStartX = 0, 
    _nStartY = 0, 
    _nBeforeX, 
    _nBeforeY;

    // private method
    var _setLayer = function(el) {
        _htWElement["wrapper"] = jindo.$Element(el);
        _htWElement["scroller"] = _htWElement["wrapper"].first();
        _setProperty();
    }, 

    _setProperty = function() {
        // wrapper 요소의 속성을 postion : relative로 변경
        _htWElement["wrapper"].css({
            "position" : "relative",
            "overflow" : "hidden"
        });
        _htWElement["scroller"].css({
            "position" : "absolute",
            "zIndex" : 1,
            "left" : 0,
            "top" : 0
        }).css("-" + _sPrefix + "-transition-property", "-" + _sPrefix + "-transform")
        .css("-" + _sPrefix + "-transform", "translate(0,0)")
        .css("-" + _sPrefix + "-transition-timing-function", "cubic-bezier(0.33,0.66,0.66,1)");
    }, 

    _setPosition = function(nLeft, nTop, nDuration) {
        nLeft = _bUseHScroll ? nLeft : 0;
        nTop = _bUseVScroll ? nTop : 0;
        nDuration = nDuration || 0;
        _nLeft = nLeft;
        _nTop = nTop;
        _transitionTime(nDuration);
        _htWElement["scroller"].css("-" + _sPrefix + "-transform", "translate(" + nLeft + "px, " + nTop + "px)");
    }, 

    _onStart = function(we) {
        var pos = we.changedTouch(0).pos();
        _transitionTime(0);
        _nBeforeX = _nStartX = pos.pageX;
        _nBeforeY = _nStartY = pos.pageY;
    }, 

    _onMove = function(we) {
        var weParent = we.oEvent, 
        pos = we.changedTouch(0).pos(), 
        nNewLeft, 
        nNewTop, 
        nVectorX = pos.pageX - _nBeforeX, 
        nVectorY = pos.pageY - _nBeforeY;
        _nBeforeX = pos.pageX;
        _nBeforeY = pos.pageY;
        nNewLeft = _nLeft + (_nLeft >= 0 || _nLeft <= _nMaxScrollLeft ? nVectorX / 2 : nVectorX);
        nNewTop = _nTop + (_nTop >= 0 || _nTop <= _nMaxScrollTop ? nVectorY / 2 : nVectorY);
        _setPosition(nNewLeft, nNewTop);
    }, 

    _onEnd = function(we) {
        _restorePosition(300);
    }, 

    _transitionTime = function(nDuration) {
        nDuration += 'ms';
        _htWElement["scroller"].css("-" + _sPrefix + "-transition-duration", nDuration);
    }, 

    _restorePosition = function(nDuration) {
        if (!_bUseHScroll && !_bUseVScroll) {
            return;
        }
        // 최대, 최소 범위 지정
        var nNewLeft = _nLeft >= 0 ? 0 : (_nLeft <= _nMaxScrollLeft ? _nMaxScrollLeft : _nLeft), 
        nNewTop = _nTop >= 0 ? 0 : (_nTop <= _nMaxScrollTop ? _nMaxScrollTop : _nTop);
        if (nNewLeft === _nLeft && nNewTop === _nTop) {
            return;
        } else {
            _setPosition(nNewLeft, nNewTop, nDuration);
        }
    }, _attachEvent = function() {
        /* Touch 이벤트용 */
        _htWElement["wrapper"].attach("touchStart", jindo.$Fn(_onStart, this).bind())
        .attach("touchMove", jindo.$Fn(_onMove, this).bind())
        .attach("touchEnd", jindo.$Fn(_onEnd, this).bind());
    };

    // 생성자
    function mScroll(el, htOption) {
        htOption = htOption || {};
        for (var property in htOption) {
            _htOption[property] = htOption[property];
        }
        _htOption["nWidth"] = isNaN(_htOption["nWidth"]) ? _htOption["nWidth"] : _htOption["nWidth"] + "px";
        _htOption["nHeight"] = isNaN(_htOption["nHeight"]) ? _htOption["nHeight"] : _htOption["nHeight"] + "px";
        _setLayer(el);
        _attachEvent();
        this.refresh();
    }

    // public
    mScroll.prototype = {
        refresh : function() {
            // wrapper 크기 지정
            if (_htOption["nWidth"] != 0) {
                _htWElement["wrapper"].css("width", _htOption["nWidth"]);
            }
            if (_htOption["nHeight"] != 0) {
                _htWElement["wrapper"].css("height", _htOption["nHeight"]);
            }
            // wrapper와 스크롤러의 크기 판별
            var nWrapperW = _htWElement["wrapper"].width() - parseInt(_htWElement["wrapper"].css("border-left-width"), 10) - parseInt(_htWElement["wrapper"].css("border-right-width"), 10), 
            nWrapperH = _htWElement["wrapper"].height() - parseInt(_htWElement["wrapper"].css("border-top-width"), 10) - parseInt(_htWElement["wrapper"].css("border-bottom-width"), 10), 
            nScrollW = _htWElement["scroller"].width(), nScrollH = _htWElement["scroller"].height();

            // 스크롤 여부 판별 및 최대 크기 지정
            _bUseHScroll = _htOption["bUseHScroll"] && (nWrapperW <= nScrollW);
            _bUseVScroll = _htOption["bUseVScroll"] && (nWrapperH <= nScrollH);
            _nMaxScrollLeft = nWrapperW - nScrollW;
            _nMaxScrollTop = nWrapperH - nScrollH;

            // 스크롤 여부에 따른 스타일 지정
            if (_bUseHScroll && !_bUseVScroll) {// 수평인 경우
                _htWElement["scroller"].css("height", "100%");
            }
            if (_bUseVScroll && !_bUseHScroll) {// 수직인 경우
                _htWElement["scroller"].css("width", "100%");
            }
        },
        setPosition : _setPosition
    };
    return mScroll;
})();