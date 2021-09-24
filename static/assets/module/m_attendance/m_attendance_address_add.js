/**
 * 添加打卡地点
 * Created by wrb on 2018/10/15.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_attendance_address_add",
        defaults = {
            isDialog:true,
            okCallBack:null
        };

    function Plugin(element, options) {
        this.element = element;

        this.settings = options;
        this._defaults = defaults;
        this._name = pluginName;

        this._point = null;//上个位置经纬度
        this._map = null;//new map对象
        this._address = '';


        this.init();
    }

    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.render();
        }
        , render: function () {
            var that = this;

            var html = template('m_attendance/m_attendance_address_add', {});
            that.renderPage(html,function () {

                that.addMapEventListener();
                that.bindActionClick();
                that.initSelect2();

            });
        }
        //渲染界面
        ,renderPage:function (html,callBack) {

            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title: that.settings.title|| '添加打卡地点',
                    area : '750px',
                    content:html,
                    cancel:function () {
                    },
                    ok:function () {
                        var data = {
                            point:that._point,
                            address:that._address,
                            punchCardName:$(that.element).find('input[name="punchCardName"]').val(),
                            punchRange:$(that.element).find('select[name="punchRange"]').val(),
                            itemKey : UUID.genV4().hexNoDelim
                        };
                        if(that.settings.okCallBack)
                            that.settings.okCallBack(data);

                    }

                },function(layero,index,dialogEle){//加载html后触发
                    that.settings.isDialog = index;//设置值为index,重新渲染时不重新加载弹窗
                    that.element = dialogEle;
                    if(callBack)
                        callBack();
                });

            }else{//不以弹窗编辑
                $(that.element).html(html);
                if(callBack)
                    callBack();
            }
        }
        ,addMapEventListener:function () {
            var that = this;
            // 百度地图API功能
            var G = function (id) {
                return document.getElementById(id);
            };
            var map = new BMap.Map("l-map");
            that._map = map;
            var ac = new BMap.Autocomplete(    //建立一个自动完成的对象
                {"input" : "suggestId"
                    ,"location" : map
                });
            ac.addEventListener("onhighlight", function(e) {  //鼠标放在下拉列表上的事件
                var str = "";
                var _value = e.fromitem.value;
                var value = "";
                if (e.fromitem.index > -1) {
                    value = _value.province +  _value.city +  _value.district +  _value.street +  _value.business;
                }
                str = "FromItem<br />index = " + e.fromitem.index + "<br />value = " + value;
                value = "";
                if (e.toitem.index > -1) {
                    _value = e.toitem.value;
                    value = _value.province +  _value.city +  _value.district +  _value.street +  _value.business;
                }
                str += "<br />ToItem<br />index = " + e.toitem.index + "<br />value = " + value;
                G("searchResultPanel").innerHTML = str;
            });
            var myValue;
            ac.addEventListener("onconfirm", function(e) {    //鼠标点击下拉列表后的事件
                var _value = e.item.value;
                myValue = _value.province +  _value.city +  _value.district +  _value.street +  _value.business;
                G("searchResultPanel").innerHTML ="onconfirm<br />index = " + e.item.index + "<br />myValue = " + myValue;

                that.setPlace(map,myValue);
            });
        }
        ,setPlace:function(map,myValue){
            var that = this;
            map.clearOverlays();    //清除地图上所有覆盖物
            var index = 0;
            var myFun = function(){
                var pt = local.getResults().getPoi(0).point;    //获取第一个智能搜索的结果
                that._point = pt;
                map.centerAndZoom(pt, 18);
                map.addOverlay(new BMap.Marker(pt));    //添加标注

                var top_right_navigation = new BMap.NavigationControl({anchor: BMAP_ANCHOR_TOP_RIGHT, type: BMAP_NAVIGATION_CONTROL_SMALL}); //右上角，仅包含平移和缩放按钮
                map.addControl(top_right_navigation);

                var geoc = new BMap.Geocoder();
                geoc.getLocation(pt, function(rs){
                    var addComp = rs.addressComponents;
                    that._address = addComp.province + addComp.city + addComp.district + addComp.street + addComp.streetNumber;
                });

                if(index<1){
                    var range = $(that.element).find('select[name="punchRange"]').val();
                    var circle = new BMap.Circle(pt,range,{
                        strokeColor:"blue",
                        strokeWeight:1,
                        strokeOpacity:0.2,
                        fillOpacity: 0.2,
                        fillColor:"blue"
                    }); //创建圆
                    map.addOverlay(circle);
                }
                index++;
            };
            var local = new BMap.LocalSearch(map, { //智能搜索
                onSearchComplete: myFun
            });
            local.search(myValue);
            $('#l-map').show();
            $('#r-result').css({
                position: 'absolute',
                top: '15px',
                left: '-100px'
            });
            var locationName = $(that.element).find('input[name="suggestId"]').val();
            $('#addressInfo').find('input[name="punchCardName"]').val(locationName);
            $('#addressInfo').show();
        }
        ,initSelect2:function () {
            var that = this;
            var $select = $(that.element).find('select[name="punchRange"]');
            $select.select2({
                width: '100%',
                allowClear: false,
                language: 'zh-CN',
                minimumResultsForSearch: Infinity
            });
            $select.change(function (e) {
                var range = $(this).val();
                var map = that._map;
                var point = that._point;
                map.centerAndZoom(point, 18);
                var circle = new BMap.Circle(point,range-0,{
                    strokeColor:"blue",//边线颜色。
                    //strokeStyle: 'solid' , //边线的样式，solid或dashed。
                    strokeWeight:1, //边线的宽度，以像素为单位。
                    strokeOpacity:0.2,//边线透明度，取值范围0 - 1。
                    fillOpacity: 0.2,  //填充的透明度，取值范围0 - 1。
                    fillColor:"blue" //填充颜色。当参数为空时，圆形将没有填充效果。
                }); //创建圆
                map.clearOverlays();
                map.addOverlay(circle);
            });
        }
        //事件绑定
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('button[data-action]').off('click').on('click',function () {
                var $this = $(this),dataAction = $this.attr('data-action');
                switch (dataAction){
                    case '':

                        break;
                }

            });
        }

    });

    /*
     1.一般初始化（缓存单例）： $('#id').pluginName(initOptions);
     2.强制初始化（无视缓存）： $('#id').pluginName(initOptions,true);
     3.调用方法： $('#id').pluginName('methodName',args);
     */
    $.fn[pluginName] = function (options, args) {
        var instance;
        var funcResult;
        var jqObj = this.each(function () {

            //从缓存获取实例
            instance = $.data(this, "plugin_" + pluginName);

            if (options === undefined || options === null || typeof options === "object") {

                var opts = $.extend(true, {}, defaults, options);

                //options作为初始化参数，若args===true则强制重新初始化，否则根据缓存判断是否需要初始化
                if (args === true) {
                    instance = new Plugin(this, opts);
                } else {
                    if (instance === undefined || instance === null)
                        instance = new Plugin(this, opts);
                }

                //写入缓存
                $.data(this, "plugin_" + pluginName, instance);
            }
            else if (typeof options === "string" && typeof instance[options] === "function") {

                //options作为方法名，args则作为方法要调用的参数
                //如果方法没有返回值，funcReuslt为undefined
                funcResult = instance[options].call(instance, args);
            }
        });

        return funcResult === undefined ? jqObj : funcResult;
    };

})(jQuery, window, document);