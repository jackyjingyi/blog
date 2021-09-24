/**
 * 职工薪酬
 * Created by wrb on 2019/2/22.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_salary_mgt",
        defaults = {
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentCompanyId = window.currentCompanyId;//当前组织ID
        this._currentCompanyUserId = window.currentCompanyUserId;//当前员工ID

        this._filterData = {
            month:getNowDate().substring(0,7),//当前年月
            companyId:this._currentCompanyId,
            orgId:null
        };
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_salary/m_salary_mgt',{month:momentFormat(that._filterData.month,'YYYY年MM月')});
            $(that.element).html(html);

            that.initOrgTree();
            that.timeSelectBind();
        }
        //初始化组织树
        , initOrgTree: function () {
            var that = this;
            $(that.element).find('#selectOrg').m_org_chose_byTree({
                type:1,
                param : {
                    permissionCode:'40001701',
                    managerPermissionCode:'40001701'
                },
                renderType:1,
                selectedId:that._currentCompanyId,
                selectedCallBack:function (data) {
                    that._filterData.companyId = data.companyId;
                    that._filterData.orgId = data.id;

                    that.renderDataList(data);
                    new leftBoxHeightResize($(that.element).find('#orgTreeBox'),$(that.element).find('#selectOrg'),$(that.element).find('#orgUserListBox'),112).init();
                }
            },true);
        }
        //渲染工资list
        , renderDataList:function (data) {
            var that = this;
            if(that._filterData.companyId==null)
                return false;

            var option = {};
            option.param = filterParam(that._filterData);
            paginationFun({
                $page: $(that.element).find('#data-pagination-container'),
                loadingId: '.data-list-box',
                url: restApi.url_listEmployeeSalary,
                params: option.param
            }, function (response) {

                if (response.code == '0') {

                    var html = template('m_salary/m_salary_mgt_user_list',{
                        dataList:response.data.data
                    });
                    $(that.element).find('.data-list-container').html(html);
                    that.bindTrClick();

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //时间选择绑定
        , timeSelectBind:function () {
            var that = this;
            $(that.element).find('span[data-action="timeSelect"]').off('click').on('click',function () {

                var endTime = $(that.element).find('input[name="endTime"]').val();
                var onpicked =function(dp){

                    that._filterData.month = dp.cal.getNewDateStr();
                    $(that.element).find('.time-span').html(momentFormat(that._filterData.month,'YYYY年MM月'));
                    that.renderDataList();

                };
                WdatePicker({el:'d12',dateFmt:'yyyy-MM',onpicked:onpicked,isShowClear:false,isShowToday:false});
            });
        }
        //表 行 事件绑定
        , bindTrClick:function () {
            var that = this;
            $(that.element).find('tr[data-id]').on('click',function () {
                location.hash = '/salary/employeeSalary/details?id='+$(this).closest('tr').attr('data-id')+'&companyId='+$(this).closest('tr').attr('data-company-id')+'&year='+(momentFormat(that._filterData.month,'YYYY'));
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
