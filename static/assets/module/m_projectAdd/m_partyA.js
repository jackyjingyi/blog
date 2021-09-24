/**
 * 工商信息查询(甲方、收票方、组织等用到)
 * Created by wrb on 2018/2/5.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_partyA",
        defaults = {
            eleId:null,
            lastSearchDetailList:null,//最近模糊查询的结果
            lastSearchCallBack:null,//最近模糊查询的结果回调
            inputChangeCallBack:null,//文本回调事件
            popoverStyle:null,//浮窗样式
            clearOnInit:true,
            targetNotQuickCloseArr:null,
            selectCallBack:null//选择后返回事件
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._lastSearchDetailList = this.settings.lastSearchDetailList;//最近模糊查询的结果
        this._$input = $('input#'+this.settings.eleId);//目标元素
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.bindInputChangeFun();
        }
        //绑定input事件,渲染popover浮窗
        ,bindInputChangeFun:function () {
            var that = this;
            that._$input.bind("input propertychange change focus",function(event){
                var txt = $.trim($(this).val());
                var partyALen = $('.m-partyA').length;

                if(that.settings.inputChangeCallBack)
                    that.settings.inputChangeCallBack(txt);

                if(txt=='')
                    return false;

                if(partyALen==0){
                    that._$input.m_floating_popover({
                        content: '<div class="m-company-box"></div>',
                        popoverClass: 'z-index-layer full-width',
                        popoverStyle: that.settings.popoverStyle,
                        placement: 'bottomLeft',
                        clearOnInit:that.settings.clearOnInit,
                        quickCloseOnTargetArr:[$('input.date-picker')],
                        targetNotQuickCloseArr:that.settings.targetNotQuickCloseArr,
                        renderedCallBack: function ($popover) {

                            that.element = $popover.find('.m-company-box');
                            var html = template('m_projectAdd/m_partyA', {});
                            $popover.find('.m-company-box').html(html);

                            if(that._lastSearchDetailList)
                                that.renderPartyAList();

                            that.bindSearchPartyAClick();

                        }
                    }, true);
                }
            });
        }
        //绑定查询事件
        , bindSearchPartyAClick:function () {
            var that = this;
            $(that.element).find('button[data-action="searchPartyA"]').off('click').on('click',function () {
                var partyAName = that._$input.val();
                partyAName = $.trim(partyAName);
                if(partyAName=='')
                    return;

                var option = {};
                option.url = restApi.url_enterpriseSearch;
                option.classId = '#partyAList';
                option.postData = {
                    name:partyAName
                };
                m_ajax.postJson(option, function (response) {
                    if (response.code == '0') {

                        that._lastSearchDetailList = response.data.details;
                        that.renderPartyAList();
                        if(that.settings.lastSearchCallBack)
                            that.settings.lastSearchCallBack(response.data.details);

                    } else {
                        S_layer.error(response.info);
                    }
                });
            });
        }
        //绑定选择事件
        , renderPartyAList:function () {
            var that = this;
            var html = template('m_projectAdd/m_partyA_list', {
                partyAList:that._lastSearchDetailList
            });
            $(that.element).find('#partyAList').html(html);

            $(that.element).find('a[data-action="selectPartyA"]').off('click').on('click',function () {
                var $this = $(this);
                var dataId = $this.attr('data-id');
                var name = $.trim($this.text());

                that._$input.val(name);
                that._$input.attr('data-id',dataId);
                that._$input.attr('data-name',name);

                that._$input.m_floating_popover('closePopover',1);//关闭浮窗

                //返回工商信息
                if(that.settings.selectCallBack){
                    var option = {};
                    option.url = restApi.url_enterpriseQueryFull;
                    option.classId = '#partyAList';
                    option.postData = {
                        name:name
                    };
                    m_ajax.postJson(option, function (response) {
                        if (response.code == '0') {

                            var resData = response.data.enterpriseDO;
                            resData.enterpriseOrgId = response.data.enterpriseOrgId;
                            that.settings.selectCallBack(resData);

                        } else {
                            S_layer.error(response.info);
                        }
                    });
                }

            });
        }


    });

    $.fn[pluginName] = function (options) {
        return this.each(function () {

            //if (!$.data(this, "plugin_" + pluginName)) {
            $.data(this, "plugin_" +
                pluginName, new Plugin(this, options));
            //}
        });
    };

})(jQuery, window, document);


