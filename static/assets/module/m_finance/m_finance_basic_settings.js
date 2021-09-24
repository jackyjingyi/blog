/**
 * 财务设置－团队基础财务数据设置
 * Created by wrb on 2018/5/23.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_finance_basic_settings",
        defaults = {
            contentEle:null,
            isFirstEnter:false//是否是第一次進來
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentRoleCodes = window.currentRoleCodes;//权限code
        this._editRoleCode = '40001504';//编辑的权限code
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.renderPage();
        }
        //初始化数据并加载模板
        ,renderPage:function () {
            var that = this;

            var option  = {};
            option.classId= '#content-box';
            option.url = restApi.url_getCompanyBalance;
            option.postData = {

            };
            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){

                    var isEdit = that._currentRoleCodes.indexOf(that._editRoleCode)>-1?1:0;
                    var html = template('m_finance/m_finance_basic_settings',{
                        companyDataList:response.data,
                        isEdit:isEdit
                    });
                    $(that.element).html(html);
                    if(isEdit==1){
                        that.bindEditable();
                    }
                    that.bindActionClick();
                }else {
                    S_layer.error(response.info);
                }
            });
        }
        , bindEditable:function () {
            var that = this;
            $(that.element).find('a.editable-click[data-action]').each(function () {
                var $this = $(this);
                var companyId = $this.closest('TR').attr('data-company-id');
                var key = $this.attr('data-key');
                var value = $this.attr('data-value');
                $this.m_editable({
                    title:'编辑',
                    popoverClass:'w-330',
                    value:value,
                    ok:function (data) {

                        if(data==false)
                            return false;

                        var $data = {};
                        $data.companyId = companyId;
                        $data.type = key;
                        $data[key] = data[key];
                        if(that.saveCompanyBalance($data)){
                            return false;
                        }
                    },
                    cancel:function () {

                    }
                },true);
            });
            $(that.element).find('a[data-action="editDate"]').off('click').on('click',function () {
                var $this = $(this);
                var $i = $this.closest('TR').attr('data-i');
                var companyId = $this.closest('TR').attr('data-company-id');
                var options = {};
                options.placement = 'right';
                options.eleId = 'a[data-action="editDate"][data-action-type="'+$i+'"]';
                options.isClear = false;
                options.okCallBack = function (data) {
                    if(data==null){
                        data = '';
                    }
                    var $data = {};
                    $data.companyId = companyId;
                    $data.type = 'setBalanceDate';
                    $data.setBalanceDate = data;
                    if(that.saveCompanyBalance($data)){
                        return false;
                    }
                };
                $this.m_quickDatePicker(options);
                return false;
            });
        }
        //保存
        , saveCompanyBalance:function ($data) {
            var that = this;
            var option  = {},isError = false;
            option.classId= '#content-box';
            option.async = false;
            option.url = restApi.url_saveCompanyBalance;
            option.postData = $data;
            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){
                    S_toastr.success('保存成功');
                    that.renderPage();

                }else {
                    S_layer.error(response.info);
                    isError = true;
                }
            });
            return isError;
        }
        //事件绑定
        ,bindActionClick:function () {

            var that = this;
            $(that.element).find('button[data-action]').off('click').on('click',function () {

                var $this = $(this),dataAction = $this.attr('data-action');
                var dataId = $this.closest('tr').attr('data-id');
                switch (dataAction){
                    case 'balanceChange'://余额变更
                        $('body').m_finance_basic_settings_change({
                            balanceId:dataId,
                            companyId:$this.closest('tr').attr('data-company-id'),
                            saveCallBack:function () {
                                that.renderPage();
                            }
                        },true);
                        break;
                    case 'changeRecord'://变更记录
                        $('body').m_finance_basic_settings_change_record({
                            id:dataId,
                            companyId:$this.closest('tr').attr('data-company-id')
                        },true);
                        break;
                }

            })

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
