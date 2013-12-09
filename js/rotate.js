(function($) {
    $.rotate = {
        /**
         * @description 이벤트 정제를 위한 timer변수
         */
        _nRotateTimer : null,

        /**
         * @description 사용자 이벤트 처리를 위한 배열
         * @type {Array}
         */
        _aRotatFunc : [],

        /**
         * @description 모바일 회전 적용 이벤트
         * @return {String} 이벤트명
         */
        getRotateEvt : function() {
            var bEvtName = 'onorientationchange' in window ? 'orientationchange' : 'resize';
            if ($.getOS() == "Android" && $.getVersion() == "2.1") {
                bEvtName = 'resize';
            }
            return bEvtName;
        },

        /**
         * @description 디바이스 기기의 가로,세로 여부를 판단함.
         * @return {Boolean} 세로일경우 true, 가로일 경우 false
         */
        getVertical : function() {
            var bVertical = null, sEventType = this.getRotateEvt();
            if (sEventType === "resize") {
                var screenWidth = document.documentElement.clientWidth;
                if (screenWidth > document.documentElement.clientHeight) {
                    bVertical = false;
                } else {
                    bVertical = true;
                }
                // console.log("getVertical : resize로 판별 -> " + bVertical);
            } else {
                var windowOrientation = window.orientation;
                if (windowOrientation === 0 || windowOrientation == 180) {
                    bVertical = true;
                } else if (windowOrientation == 90 || windowOrientation == -90) {
                    bVertical = false;
                }
                // console.log("getVertical : orientationChange로 판별 -> " + bVertical);
            }
            return bVertical;
        },

        /**
         * @description 이벤트를 등록한다.
         */
        attachEvent : function() {
            var self = this;
            window.addEventListener(this.getRotateEvt(), function() {
                self._onRotate();
            });
        },

        /**
         * @description 모바일 회전이 발생하는 경우
         */
        _onRotate : function(evt) {
            var self = this;
            if (this.getRotateEvt() === "resize") {
                // console.log("Rotate Event is resize");
                setTimeout(function() {
                    self._fire();
                }, 0);
            } else {
                // console.log("Rotate Event is orientationChange");
                if ($.getOS() == "Android") {
                    clearTimeout(this._nRotateTimer);
                    this._nRotateTimer = setTimeout(function() {
                        self._fire();
                    }, 500);
                } else {
                    self._fire();
                }
            }
        },

        _fire : function() {
            for (var i = 0, len = this._aRotatFunc.length; i < len; i++) {
                this._aRotatFunc[i].call(this, event);
            }
        },

        bind : function(func) {
            this._aRotatFunc.push(func);
        },

        unbind : function(func) {
            for (var i = 0, len = this._aRotatFunc.length; i < len; i++) {
                if (this._aRotatFunc[i] === func) {
                    this._aRotatFunc.splice(i, 1);
                    break;
                }
            }
        }
    };
    $.rotate.attachEvent();
})(window.m);
