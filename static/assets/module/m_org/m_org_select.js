/**
 * 选择组织与部门
 * Created by wrb on 2018/10/23.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_org_select",
        defaults = {
            isBtnSm:false,
            orgParam:null,//组织请求参数
            dataInfo:null,
            selectCallBack:null,//选择回调
            renderCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;
        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentCompanyId = window.currentCompanyId;
        this._selectedOrg = null;//当前选中的组织
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;

            that.getCompanyListByParam(function (resData) {

                that.getDepartByCompanyId(function (data) {//查询部门


                    that.settings.dataInfo
                    if(!that.settings.dataInfo || isNullOrBlank(that.settings.dataInfo.companyId)){
                        that.settings.dataInfo = {};
                        that.settings.dataInfo.companyId = (resData.allCompanyList!=null && resData.allCompanyList.length>0)?resData.allCompanyList[0].id:'';
                        that.settings.dataInfo.orgName = (resData.allCompanyList!=null && resData.allCompanyList.length>0)?resData.allCompanyList[0].companyName:'';
                    }

                    var html = template('m_org/m_org_select', {
                        isBtnSm:that.settings.isBtnSm,
                        currentCompanyId: that._currentCompanyId,
                        allCompanyList: resData.allCompanyList,
                        departList: data,
                        dataInfo:that.settings.dataInfo
                    });
                    $(that.element).html(html);
                    if(that.settings.renderCallBack)
                        that.settings.renderCallBack({companyId:resData.allCompanyList[0].id});

                    that.dealSelectOrgEvent();
                });
            });

        }
        //查询组织
        ,getCompanyListByParam:function (callBack) {
            var that = this,option={};
            option.url=restApi.url_getIssueTaskCompany;
            option.postData = {};
            var param = {};
            $.extend(param, that.settings.orgParam);
            option.postData = param;
            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){
                    if(callBack!=null)
                        callBack(response.data);
                }else {
                    S_layer.error(response.info);
                }
            })
        }
        //查询组织部门
        ,getDepartByCompanyId:function (callBack) {
            var that = this;
            var option  = {};
            option.url = restApi.url_getDepartByCompanyId+'/'+that._currentCompanyId;
            m_ajax.get(option,function (response) {
                if(response.code=='0'){
                    return callBack(response.data);
                }else {
                    S_layer.error(response.info);
                }
            })
        }
        //选中组织事件
        ,dealSelectOrgEvent:function (type) {
            var that = this;
            $(that.element).find('a.open-depart-btn').on('click',function (e) {//打开部门选择

                if($(this).find('i').hasClass('fa-angle-double-down')){
                    $(this).find('i').removeClass('fa-angle-double-down').addClass('fa-angle-double-up');
                    $(this).next('.dropdown-menu').show();
                }else{
                    $(this).find('i').addClass('fa-angle-double-down').removeClass('fa-angle-double-up');
                    $(this).next('.dropdown-menu').hide();
                }
                e.stopPropagation();
            });
            $(that.element).find('a[data-action="choseOrg"]').on('click',function (e) {//选择组织处理事件

                var $that = $(this).closest('#selectOrg');
                var dataChoseType = $(this).attr('data-chose-type');
                var companyName = $(this).text();
                var companyId = $(this).attr('data-company-id');
                var departId = null;
                if(typeof($(this).attr('disabled')) != 'undefined'){
                    if(that.settings.selectCallBack)
                        that.settings.selectCallBack(null);
                    $that.find('.dropdown-menu').hide();
                    return false;
                }

                $that.find('.company-name').html(companyName);
                if(dataChoseType=='company'){
                    $that.find('.company-name').attr('data-company-id',companyId);
                    $that.find('.company-name').attr('data-depart-id','');
                }else{
                    companyId = $(this).parents('ul').parent().find('a:first').attr('data-company-id');
                    departId = $(this).attr('data-company-id');
                    $that.find('.company-name').attr('data-company-id',companyId);
                    $that.find('.company-name').attr('data-depart-id',departId);
                }

                if(that.settings.selectCallBack)
                    that.settings.selectCallBack({companyId:companyId,departId:departId});

                $that.find('.dropdown-menu').hide();
                $that.find('a.open-depart-btn i').addClass('fa-angle-double-down').removeClass('fa-angle-double-up');
                $(this).attr('disabled');

                e.stopPropagation();
            });
            $(that.element).find('button:first').on('click',function () {//点击选择btn事件

                var $that = $(this).closest('#selectOrg');
                if($that.find('.dropdown-menu').eq(0).css('display')=='none'){
                    $('.org-select-box .dropdown-menu').hide();
                    $that.find('.dropdown-menu').eq(0).show();
                }else{
                    $that.find('.dropdown-menu').hide();
                }
                //处理选中效果状态(加底色不可触发)
                var selectedCompanyId = $that.find('button .company-name').attr('data-company-id');
                var selectedDepartId = $that.find('button .company-name').attr('data-depart-id');
                if(selectedDepartId!=undefined && selectedDepartId!=''){//选择的是部门
                    selectedCompanyId = selectedDepartId;
                }
                $that.find('a[data-action="choseOrg"]').css('background-color','');
                $that.find('a[data-action="choseOrg"]').removeAttr('disabled');
                var $ele = $that.find('a[data-action="choseOrg"][data-company-id="'+selectedCompanyId+'"]');
                $ele.css('background-color','#f5f5f5');
                $ele.attr('disabled','disabled');
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
