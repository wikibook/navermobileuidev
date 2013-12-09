window.mTouch = (function() {

    // private memeber
    var _wel = null, 
    _htOption = {
        nMomentumDuration : 350,
        nMoveThreshold : 7,
        nSlopeThreshold : 25,
        nLongTapDuration : 1000,
        nDoubleTapDuration : 400,
        nTapThreshold : 6,
        nPinchThreshold : 0.1,
        nRotateThreshold : 5,
        nEndEventThreshold : 0
    }, 
    _htTouchEventName = {
        start : 'mousedown',
        move : 'mousemove',
        end : 'mouseup',
        cancel : null
    }, 
    _bStart = false, 
    _bMove = false, 
    _nMoveType = -1, 
    _htEndInfo = {}, 
    _nVSlope = 0, 
    _nHSlope = 0, 
    _htEventHandler = {}, 
    _htMoveInfo = {
        nStartX : 0,
        nStartY : 0,
        nBeforeX : 0,
        nBeforeY : 0,
        nStartTime : 0,
        nBeforeTime : 0,
        nStartDistance : 0,
        nBeforeDistance : 0,
        nStartAngle : 0,
        nLastAngle : 0
    };

    var _initVar = function() {
        _htEventHandler = {};
        if ('ontouchstart' in window) {
            _htTouchEventName.start = 'touchstart';
            _htTouchEventName.move = 'touchmove';
            _htTouchEventName.end = 'touchend';
            _htTouchEventName.cancel = 'touchcancel';
        } else if (window.navigator.msPointerEnabled) {
            _htTouchEventName.start = 'MSPointerDown';
            _htTouchEventName.move = 'MSPointerMove';
            _htTouchEventName.end = 'MSPointerUp';
            _htTouchEventName.cancel = 'MSPointerCancel';
        }
    };
    var _setLayer = function(el) {
        _wel = jindo.$Element(el);
    }
    var _attachEvent = function() {
        _wel.attach(_htTouchEventName.start, jindo.$Fn(_onStart, this).bind())
            .attach(_htTouchEventName.move, jindo.$Fn(_onMove, this).bind())
            .attach(_htTouchEventName.end, jindo.$Fn(_onEnd, this).bind());
        if (_htTouchEventName.cancel) {
            _wel.attach(_htTouchEventName.cancel, jindo.$Fn(_onEnd, this).bind());
        }
    };

    var _onStart = function(oEvent) {
        //touch 정보들의 초기화
        _resetTouchInfo();

        var htInfo = _getTouchInfo(oEvent);

        var htParam = {
            element : htInfo[0].el,
            nX : htInfo[0].nX,
            nY : htInfo[0].nY,
            oEvent : oEvent
        };

        if (!_fireEvent('touchStart', htParam)) {
            return;
        }

        //touchstart 플래그 세팅
        _bStart = true;

        //move info update
        _htMoveInfo.nStartX = htInfo[0].nX;
        _htMoveInfo.nBeforeX = htInfo[0].nX;
        _htMoveInfo.nStartY = htInfo[0].nY;
        _htMoveInfo.nBeforeY = htInfo[0].nY;
        _htMoveInfo.nStartTime = htInfo[0].nTime;
        _htMoveInfo.aStartInfo = htInfo;

        _startLongTapTimer(htInfo, oEvent);

    };

    var _onMove = function(oEvent) {
        if (!_bStart) {
            return;
        }
        _bMove = true;

        var htInfo = _getTouchInfo(oEvent);

        //현재 _nMoveType이 없거나 tap 혹은 longTap일 때 다시 _nMoveType을 계산한다..
        if (_nMoveType < 0 || _nMoveType == 3 || _nMoveType == 4) {
            var nMoveType = _getMoveType(htInfo[0].nX, htInfo[0].nY);
            if (!((_nMoveType == 4) && (nMoveType == 3))) {
                _nMoveType = nMoveType;
            }
        }
        //커스텀 이벤트에 대한 파라미터 생성.
        htParam = _getCustomEventParam(htInfo, false);

        //longtap timer 삭제
        if (( typeof _nLongTapTimer != 'undefined') && _nMoveType != 3) {
            _deleteLongTapTimer();
        }

        htParam.oEvent = oEvent;

        var nDis = 0;
        if (_nMoveType == 0) {//hScroll일 경우
            nDis = Math.abs(htParam.nVectorX);
        } else if (_nMoveType == 1) {//vScroll일 경우
            nDis = Math.abs(htParam.nVectorY);
        } else {//dScroll 일 경우
            nDis = Math.abs(htParam.nVectorX) + Math.abs(htParam.nVectorY);
        }

        //move간격이 옵션 설정 값 보다 작을 경우에는 커스텀이벤트를 발생하지 않는다
        if (nDis < _htOption['nMoveThreshold']) {
            return;
        }

        if (!_fireEvent('touchMove', htParam)) {
            _bStart = false;
            return;
        }
        //touchInfo 정보의  before 정보만 업데이트 한다.
        _htMoveInfo.nBeforeX = htInfo[0].nX;
        _htMoveInfo.nBeforeY = htInfo[0].nY;
        _htMoveInfo.nBeforeTime = htInfo[0].nTime;
    };

    var _onEnd = function(oEvent) {
        if (!_bStart) {
            return;
        }
        _deleteLongTapTimer();
        //touchMove이벤트가 발생하지 않고 현재 롱탭이 아니라면 tap으로 판단한다.
        if (!_bMove && (_nMoveType != 4)) {
            _nMoveType = 3;
        }

        //touchEnd 시점에 판단된  moveType이 없으면 리턴한다.
        if (_nMoveType < 0) {
            return;
        }

        var htInfo = _getTouchInfo(oEvent);

        //현재 touchEnd시점의 타입이 doubleTap이라고 판단이 되면
        if (_isDblTap(htInfo[0].nX, htInfo[0].nY, htInfo[0].nTime)) {
            clearTimeout(_nTapTimer);
            delete _nTapTimer;
            _nMoveType = 5;
            //doubleTap 으로 세팅
        }

        //커스텀 이벤트에 대한 파라미터 생성.
        var htParam = _getCustomEventParam(htInfo, true);
        htParam.oEvent = oEvent;
        var sMoveType = htParam.sMoveType;

        //doubletap 핸들러가  있고, 현재가  tap 인 경우
        if (( typeof _htEventHandler[m.MOVETYPE[5]] != 'undefined' && (_htEventHandler[m.MOVETYPE[5]].length > 0)) && (_nMoveType == 3)) {
            _nTapTimer = setTimeout(function() {
                _fireEvent('touchEnd', htParam);
                _fireEvent(sMoveType, htParam);
                delete _nTapTimer;
            }, _htOption['nDoubleTapDuration']);

        } else {
            _fireEvent('touchEnd', htParam);
            if (_nMoveType != 4) {
                _fireEvent(sMoveType, htParam);
            }
        }

        //touchEnd info 업데이트
        _htEndInfo = {
            element : htInfo[0].el,
            time : htInfo[0].nTime,
            movetype : _nMoveType,
            nX : htInfo[0].nX,
            nY : htInfo[0].nY
        };
        _resetTouchInfo();
    };

    var _resetTouchInfo = function() {
        for (var x in _htMoveInfo) {
            _htMoveInfo[x] = 0;
        }
        _deleteLongTapTimer();
        _bStart = false;
        _bMove = false;
        _nMoveType = -1;
    };

    var _isDblTap = function(nX, nY, nTime) {
        if (( typeof _nTapTimer != 'undefined') && _nMoveType == 3) {
            var nGap = _htOption['nTapThreshold'];
            if ((Math.abs(_htEndInfo.nX - nX) <= nGap) && (Math.abs(_htEndInfo.nY - nY) <= nGap)) {
                return true;
            }
        }
        return false;
    };

    var _getTouchInfo = function(oEvent) {
        var aReturn = [];
        var nTime = oEvent.$value().timeStamp;

        if ( typeof oEvent.$value().changedTouches !== 'undefined') {
            var oTouch = oEvent.$value().changedTouches;
            for (var i = 0, nLen = oTouch.length; i < nLen; i++) {
                aReturn.push({
                    el : oTouch[i].target,
                    nX : oTouch[i].pageX,
                    nY : oTouch[i].pageY,
                    nTime : nTime
                });
            }

        } else {
            aReturn.push({
                el : oEvent.element,
                nX : oEvent.pos().pageX,
                nY : oEvent.pos().pageY,
                nTime : nTime
            });
        }

        return aReturn;
    };

    var _getMoveType = function(x, y) {
        var nType = _nMoveType;

        var nX = Math.abs(_htMoveInfo.nStartX - x);
        var nY = Math.abs(_htMoveInfo.nStartY - y);
        var nDis = nX + nY;

        //tap정의
        var nGap = _htOption['nTapThreshold'];
        if ((nX <= nGap) && (nY <= nGap)) {
            nType = 3;
        } else {
            nType = -1;
        }

        if (_htOption['nSlopeThreshold'] <= nDis) {
            var nSlope = parseFloat((nY / nX).toFixed(2), 10);

            if ((_nHSlope === -1) && (_nVSlope === -1)) {
                nType = 2;
            } else {
                if (nSlope <= _nHSlope) {
                    nType = 0;
                } else if (nSlope >= _nVSlope) {
                    nType = 1;
                } else {
                    nType = 2;
                }
            }
        }

        return nType;
    };

    var _getCustomEventParam = function(htTouchInfo, bTouchEnd) {
        var sMoveType = m.MOVETYPE[_nMoveType];
        var nDuration = htTouchInfo[0].nTime - _htMoveInfo.nStartTime;
        var nVectorX = nVectorY = nMomentumX = nMomentumY = nSpeedX = nSpeedY = nDisX = nDisY = 0;

        nDisX = (_nMoveType === 1) ? 0 : htTouchInfo[0].nX - _htMoveInfo.nStartX;
        //vScroll
        nDisY = (_nMoveType === 0) ? 0 : htTouchInfo[0].nY - _htMoveInfo.nStartY;
        //hScroll

        nVectorX = htTouchInfo[0].nX - _htMoveInfo.nBeforeX;
        nVectorY = htTouchInfo[0].nY - _htMoveInfo.nBeforeY;
        //scroll 이벤트만 계산 한다
        if (bTouchEnd && (_nMoveType == 0 || _nMoveType == 1 || _nMoveType == 2 )) {
            if (nDuration <= _htOption['nMomentumDuration']) {
                nSpeedX = Math.abs(nDisX) / nDuration;
                nMomentumX = (nSpeedX * nSpeedX) / 2;

                nSpeedY = Math.abs(nDisY) / nDuration;
                nMomentumY = (nSpeedY * nSpeedY) / 2;
            }
        }

        var htParam = {
            element : htTouchInfo[0].el,
            nX : htTouchInfo[0].nX,
            nY : htTouchInfo[0].nY,
            nVectorX : nVectorX,
            nVectorY : nVectorY,
            nDistanceX : nDisX,
            nDistanceY : nDisY,
            sMoveType : sMoveType,
            nStartX : _htMoveInfo.nStartX,
            nStartY : _htMoveInfo.nStartY,
            nStartTimeStamp : _htMoveInfo.nStartTime
        };

        if (htTouchInfo.length >= 1) {
            var aX = [];
            var aY = [];
            var aElement = [];
            for (var i = 0, nLen = htTouchInfo.length; i < nLen; i++) {
                aX.push(htTouchInfo[i].nX);
                aY.push(htTouchInfo[i].nY);
                aElement.push(htTouchInfo[i].el);
            }
            htParam.aX = aX;
            htParam.aY = aY;
            htParam.aElement = aElement;
        }

        //touchend 에는 가속에 대한 계산값을 추가로 더 필요로 한다.
        if (bTouchEnd) {
            htParam.nMomentumX = nMomentumX;
            htParam.nMomentumY = nMomentumY;
            htParam.nSpeedX = nSpeedX;
            htParam.nSpeedY = nSpeedY;
            htParam.nDuration = nDuration;
        }

        return htParam;
    };

    var _fireEvent = function(sEvent, oEvent) {
        oEvent = oEvent || {};
        var aHandlerList = _htEventHandler[sEvent] || [], bHasHandlerList = aHandlerList.length > 0;

        if (!bHasHandlerList) {
            return true;
        }
        aHandlerList = aHandlerList.concat();
        //fireEvent수행시 핸들러 내부에서 detach되어도 최초수행시의 핸들러리스트는 모두 수행

        oEvent.sType = sEvent;
        if ( typeof oEvent._aExtend == 'undefined') {
            oEvent._aExtend = [];
            oEvent.stop = function() {
                if (oEvent._aExtend.length > 0) {
                    oEvent._aExtend[oEvent._aExtend.length - 1].bCanceled = true;
                }
            };
        }
        oEvent._aExtend.push({
            sType : sEvent,
            bCanceled : false
        });

        var aArg = [oEvent], i, nLen;

        for ( i = 2, nLen = arguments.length; i < nLen; i++) {
            aArg.push(arguments[i]);
        }

        if (bHasHandlerList) {
            var fHandler;
            for ( i = 0, fHandler; ( fHandler = aHandlerList[i]); i++) {
                fHandler.apply(this, aArg);
            }
        }

        return !oEvent._aExtend.pop().bCanceled;
    };

    var _setSlope = function() {
        _nHSlope = ((window.innerHeight / 2) / window.innerWidth).toFixed(2) * 1;
        _nVSlope = (window.innerHeight / (window.innerWidth / 2)).toFixed(2) * 1;
    };

    var _deleteLongTapTimer = function() {
        if ( typeof _nLongTapTimer !== 'undefined') {
            clearTimeout(_nLongTapTimer);
            delete _nLongTapTimer;
        }
    };

    var _startLongTapTimer = function(htInfo, oEvent) {
        //long tap handler 가 있을경우
        if (( typeof _htEventHandler[m.MOVETYPE[4]] != 'undefined') && (_htEventHandler[m.MOVETYPE[4]].length > 0)) {
            self._nLongTapTimer = setTimeout(function() {
                _fireEvent('longTap', {
                    element : htInfo[0].el,
                    oEvent : oEvent,
                    nX : htInfo[0].nX,
                    nY : htInfo[0].nY
                });
                delete _nLongTapTimer;
                //현재 moveType 세팅
                _nMoveType = 4;
            }, _htOption['nLongTapDuration']);
        }
    };

    // 생성자
    function mTouch(el, htOption) {
        htOption = htOption || {};
        for (var property in htOption) {
            _htOption[property] = htOption[property];
        }

        _initVar();
        _wel = jindo.$Element(el);
        _setSlope();
        _attachEvent();
    }


    mTouch.prototype = {
        attach : function(sEvent, fHandlerToAttach) {
            var aHandler = _htEventHandler[sEvent];

            if ( typeof aHandler == 'undefined') {
                aHandler = _htEventHandler[sEvent] = [];
            }

            aHandler.push(fHandlerToAttach);

            return mTouch;
        }
    };
    return mTouch;
})();
