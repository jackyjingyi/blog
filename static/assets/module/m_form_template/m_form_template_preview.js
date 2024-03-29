/**
 * 审批管理-审批表单预览
 * Created by wrb on 2018/9/19.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_form_template_preview",
        defaults = {
             isDialog:true
            ,type:1//1=我的审批
            ,formId:null//表单ID
            ,selectedOrg:null//当前选中组织
            ,dataInfo:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentUserId = window.currentUserId;
        this._currentCompanyId = window.currentCompanyId;

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.getData(function () {
                var html = template('m_form_template/m_form_template_preview',{
                    title:that._title,
                    subTitle:that._subTitle,
                    dataInfo:that.settings.dataInfo
                });
                that.renderDialog(html,function (layero,index,dialogEle) {


                    //固定表单
                    if(that.settings.dataInfo && (that.settings.dataInfo.id=='projectSetUp' || that.settings.dataInfo.id=='contractAudit')){//项目立项，合同审批

                        var iHtml = template('m_form_template/m_form_template_project',{doType:that.settings.dataInfo.id});
                        $(that.element).find('form').append(iHtml);

                    }else if(that.settings.dataInfo && that.settings.dataInfo.id=='expApply'){//往来付款申请

                        var iHtml = template('m_approval/m_approval_cost_add',{formView:1});
                        $(that.element).find('form').html(iHtml);

                    }else if(that.settings.dataInfo && that.settings.dataInfo.id=='singleFundChange'){//资金变动

                        var iHtml = template('m_finance_confirm/m_approval_capital_changes_add',{formView:1});
                        $(that.element).find('form').html(iHtml);

                    }else{//动态表单
                        if(that.settings.dataInfo && that.settings.dataInfo && that.settings.dataInfo.fieldList){

                            var j = -1;
                            $.each(that.settings.dataInfo.fieldList,function (i,item) {

                                item.fieldId = item.id;
                                if(i==j)
                                    return true;

                                if(item.fieldType==4){//时间区间，需要合并一个组件
                                    j = i+1;
                                    item.fieldTitle2 = that.settings.dataInfo.fieldList[i+1].fieldTitle;
                                    item.fieldTooltip2 = that.settings.dataInfo.fieldList[i+1].fieldTooltip;
                                }
                                var iHtml = template('m_form_template/m_form_template_itemForEdit',item);
                                $(that.element).find('form').eq(0).append(iHtml);

                                var $panel = $(that.element).find('.form-item[data-type="9"][data-field-id="'+item.fieldId+'"] .panel form');

                                if(item.detailFieldList!=null && item.detailFieldList.length>0){

                                    var subJ = -1;
                                    $.each(item.detailFieldList,function (subI,subItem) {

                                        subItem.fieldId = subItem.id;
                                        if(subI==subJ)
                                            return true;

                                        if(subItem.fieldType==4){//时间区间，需要合并一个组件
                                            subJ = subI+1;
                                            subItem.fieldTitle2 = item.detailFieldList[i+1].fieldTitle;
                                            subItem.fieldTooltip2 = item.detailFieldList[i+1].fieldTooltip;
                                        }
                                        var iHtml = template('m_form_template/m_form_template_itemForEdit',subItem);
                                        $panel.append(iHtml);
                                    });
                                }
                            });
                        }
                    }

                    that.renderICheckOrSelect();
                    S_layer.resize(layero,index,dialogEle);
                    return false;
                });
            });
        }
        //渲染列表内容
        ,renderDialog:function (html,callBack) {
            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title:'表单预览-'+that.settings.dataInfo.formName || '我的审批',
                    area : '980px',
                    fixed:true,
                    scrollbar:false,
                    content:html,
                    cancel:function () {

                    },
                    ok:function () {

                    }

                },function(layero,index,dialogEle){//加载html后触发
                    that.settings.isDialog = index;//设置值为index,重新渲染时不重新加载弹窗
                    that.element = dialogEle;
                    if(callBack)
                        callBack(layero,index,dialogEle);
                    //S_layer.resize(layero,index,dialogEle);
                });

            }else{//不以弹窗编辑
                $(that.element).html(html);
                if(callBack)
                    callBack();
            }

        }
        //初始化iCheck
        ,renderICheckOrSelect:function () {

            var that = this;
            var ifChecked = function (e) {
            };
            var ifUnchecked = function (e) {
            };
            var ifClicked = function (e) {
            };
            $(that.element).find('.i-checks').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            }).on('ifUnchecked.s', ifUnchecked).on('ifChecked.s', ifChecked).on('ifClicked',ifClicked);
            $(that.element).find('select').select2({
                tags:false,
                allowClear: false,
                minimumResultsForSearch: -1,
                width:'100%',
                language: "zh-CN"
            });
        }

        //获取数据
        ,getData: function (callBack) {
            var that = this;

            if(that.settings.formId){

                var option = {};
                option.url = restApi.url_prepareFormToEdit ;
                option.postData = {};
                option.postData.companyId = that.settings.selectedOrg.id;
                option.postData.id = that.settings.formId;
                m_ajax.postJson(option, function (response) {

                    if (response.code == '0') {

                        that.settings.dataInfo = response.data;
                        that.settings.dataInfo.formName = response.data.name;

                        if(callBack)
                            callBack(response.data);

                    } else {
                        S_layer.error(response.info);
                    }
                });

            }else{

                if(callBack)
                    callBack();
            }



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
