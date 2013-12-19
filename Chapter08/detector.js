(function($) {
    /**
     * 운영체제 해시 테이블(운영체제 이름 : 정규식)
     */

    console.log($);

    var htOs = {
        iOS : /like Mac OS X/,
        Android : /Android/
    },

    /**
     * 기기 종류 해시 테이블(기기 종류 : 정규식)
     */
    htDevice = {
        iphone : /iPhone/,
        ipad : /iPad/,
        galaxyS : /SHW-M110/,
        galaxyS2 : /SHW-M250|GT-I9100|SHV-E110/,
        galaxyS3 : /SHV-E210|SHW-M440|GT-I9300/,
        galaxyS4 : /SHV-E300|GT-i9500|GT-i9505|SGH-M919|SPH-L720|SGH-I337|SCH-I545/,
        optimusLte : /LG-LU6200/,
        optimusLte2 : /LG-F160/
    };

    /**
     * 해시 테이블을 순환하여 true를 반환하는 함수
     */
    function eachHash(ht) {
        for (var key in ht) {
            if (ht[key].test(navigator.userAgent)) {
                return key;
            }
        }
        return "";
    };

    $.detector = {
        /**
         * 운영체제 이름을 반환
         */
        os : function() {
            return eachHash(htOs);
        },
        /**
         * 운영체제 버전을 반환
         */
        osVersion : function() {
            var version = "", a;
            switch(this.os()) {
                case "iOS" :
                    a = navigator.userAgent.match(/OS\s([\d|\_]+\s)/i);
                    break;
                case "Android" :
                    a = navigator.userAgent.match(/Android\s([^\;]*)/i);
                    break;
            }
            if (a != null && a.length > 1) {
                version = a[1].replace(/\_/g, ".").replace(/\s/g, "")
            }
            return version;
        },

        /**
         * 기기 종류를 반환
         */
        device : function() {
            return eachHash(htDevice);
        }
    };
})(window); 