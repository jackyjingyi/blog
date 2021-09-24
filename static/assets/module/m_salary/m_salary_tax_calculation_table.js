/**
 * 个税扣除预缴计算综合报表
 * Created by wrb on 2019/2/26.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_salary_tax_calculation_table",
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
            companyUserId:null
        };
        this._managerCompanyIds = null;//组织树请求返回的数据(extendData)
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_salary/m_salary_tax_calculation_table',{});
            $(that.element).html(html);

            $(that.element).find('#selectOrg').m_org_chose_byTree({
                type:1,
                param : {
                    permissionCode:'40001704',
                    managerPermissionCode:'40001706'
                },
                selectedId:that._currentCompanyId,
                selectedCallBack:function (data) {
                    that._filterData.companyId = data.id;
                    that.renderDataList();
                },
                renderCallBack:function (extendData) {
                    //权限控制
                    that._managerCompanyIds = extendData && extendData.managerCompanyIds?extendData.managerCompanyIds:'';

                }
            },true);
            that.bindActionClick();
            rolesControl();
        }
        //渲染list
        , renderDataList:function () {
            var that = this;

            var option = {};
            option.param = {};
            option.param = filterParam(that._filterData);

            paginationFun({
                $page: $(that.element).find('#data-pagination-container'),
                loadingId: '.data-list-box',
                url: restApi.url_querySalaryTaxReportList,
                params: option.param
            }, function (response) {

                if (response.code == '0') {

                    var html = template('m_salary/m_salary_tax_calculation_table_list',{
                        dataList:response.data.data,
                        month:momentFormat(that._filterData.month,'YYYY年MM月'),
                        pageIndex:$(that.element).find("#data-pagination-container").pagination('getPageIndex')
                    });
                    $(that.element).find('.data-list-container').html(html);

                    //权限控制
                    if(!(that._managerCompanyIds.indexOf(that._filterData.companyId)>-1) ){
                        $(that.element).find('button[data-action="exportDetails"],a[data-action="importDetails"]').hide();
                    }else{
                        $(that.element).find('button[data-action="exportDetails"],a[data-action="importDetails"]').show();
                    }

                    that.timeSelectBind();
                    that.filterActionClick();
                    that.getSum();
                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //合计数据
        , getSum:function () {
            var that = this;
            $(that.element).find('.data-list-container table tbody tr.detailTr').each(function(i,e){

                $(this).find('td').each(function(index,element){
                    if(index>1){
                       // var that_td = $(that.element).find('.data-list-container table tbody tr td[index='+index+']');
                        var that_td = $(that.element).find('.data-list-container table tbody tr.sumTr td').eq(index);
                        var value = that_td.text();
                        if(isNullOrBlank(value)){
                            value = '0';
                        }
                        var textValue = $(this).text();
                        if(isNullOrBlank(textValue)){
                            textValue = '0';
                        }
                        value = parseFloat(value) + parseFloat(textValue);
                        that_td.text(value.toFixed(2));
                    }
                });
            });
            $(that.element).find('.data-list-container table tbody tr.sumTr td.notSum').text('');
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
        //事件绑定
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('button[data-action]').off('click').on('click',function () {
                var $this = $(this);
                var dataAction = $this.attr('data-action');
                switch (dataAction){
                    case 'exportDetails'://导出
                        downLoadFile({
                            url:restApi.url_exportSalaryReportList,
                            data:filterParam(that._filterData),
                            type:1
                        });
                        return false;
                        break;
                }
            });
            $(that.element).find('a[data-action="importDetails"]').m_fileUploader({
                server: restApi.url_importSalaryReportList,
                fileExts: 'xls,xlsx',
                fileSingleSizeLimit: 20 * 1024 * 1024,
                formData: {},
                innerHTML: '导入表格',
                loadingId: '#content-box .ibox',
                uploadBeforeSend: function (object, data, headers) {
                    data.month = that._filterData.month;
                    data.companyId = that._filterData.companyId;
                },
                uploadSuccessCallback: function (file, res) {
                    if (res.code === '0') {
                        S_toastr.success('文件上传成功');
                        that.renderDataList();
                    } else {
                        S_toastr.error(res.info);
                    }
                }
            }, true);
        }
        //筛选事件
        , filterActionClick:function () {
            var that = this;
            $(that.element).find('a.icon-filter').each(function () {

                var $this = $(this);
                var id = $this.attr('id');
                var filterArr = id.split('_');
                switch (id){
                    case 'filter_userName': //项目

                        var option = {};

                        option.inputValue = that._filterData[filterArr[1]];
                        option.eleId = id;
                        option.oKCallBack = function (data) {

                            that._filterData[filterArr[1]] = data;
                            that.renderDataList();
                        };
                        $this.m_filter_input(option, true);

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
