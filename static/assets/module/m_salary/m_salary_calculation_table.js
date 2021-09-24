/**
 * 工资计算表
 * Created by wrb on 2019/2/26.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_salary_calculation_table",
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
            companyUserId:null,
            pageIndex:null

        };
        this._managerCompanyIds = null;//组织树请求返回的数据(extendData)
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_salary/m_salary_calculation_table',{});
            $(that.element).html(html);

            $(that.element).find('#selectOrg').m_org_chose_byTree({
                type:1,
                param : {
                    permissionCode:'40001702',
                    managerPermissionCode:'40001703'
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
                url: restApi.url_querySalaryList,
                params: option.param
            }, function (response) {

                if (response.code == '0') {

                    that._filterData.pageIndex = $(that.element).find("#data-pagination-container").pagination('getPageIndex');
                    var html = template('m_salary/m_salary_calculation_table_list',{
                        dataList:response.data.data,
                        managerCompanyIds:that._managerCompanyIds,
                        month:momentFormat(that._filterData.month,'YYYY年MM月'),
                        pageIndex:that._filterData.pageIndex,
                        isCreateSalaryReport:response.extendData.isCreateSalaryReport
                    });
                    $(that.element).find('.data-list-container').html(html);


                    //权限控制
                    if(response.extendData.isCreateSalaryReport=='1' || !(that._managerCompanyIds.indexOf(that._filterData.companyId)>-1) ){

                        $(that.element).find('button[data-action="exportDetails"],a[data-action="importDetails"],button[data-action="generateReport"],button[data-action="saveReport"]').hide();

                    }else{

                        $(that.element).find('button[data-action="exportDetails"],a[data-action="importDetails"],button[data-action="generateReport"],button[data-action="saveReport"]').show();
                    }

                    if(that._managerCompanyIds.indexOf(that._filterData.companyId)>-1){
                        that.bindEditable();
                    }else{

                        $(that.element).find('a[data-action="edit"]').removeClass('editable-click').addClass('no-hover');
                    }
                    that.bindActionClick();
                    that.timeSelectBind();
                    that.filterActionClick();

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
        , bindEditable:function () {
            var that = this;
            $(that.element).find('a.editable-click[data-action]').each(function () {
                var $this = $(this);
                var id = $this.closest('TR').attr('data-id');
                var cellphone = $this.closest('TR').attr('data-cellphone');
                var companyUserId = $this.closest('TR').attr('data-company-user-id');
                var key = $this.attr('data-key');
                var value = $this.attr('data-value');
                var unit = $this.attr('data-unit');

                var placement = 'bottom';
                if(key=='allowDeductDonate' || key=='other')
                    placement = 'left';

                $this.m_editable({
                    title: '编辑',
                    placement:placement,
                    popoverClass: 'w-330',
                    inputGroupClass: (isNullOrBlank(unit)?null:'input-group width-200'),
                    value: value,
                    ok: function (data) {

                        if (data == false)
                            return false;

                        var $data = {};
                        $data.id = id;
                        $data.cellphone = cellphone;
                        $data.companyId = that._filterData.companyId;
                        $data.companyUserId = companyUserId;
                        $data.month = that._filterData.month;
                        $data[key] = data[key];
                        if (that.saveSalary($data)) {
                            return false;
                        }
                    },
                    cancel: function () {

                    }
                }, true);
            });
        }
        , saveSalary:function (data) {
            var options={},that=this;
            options.classId = that.element;
            options.url=restApi.url_updateSalaryById;
            options.postData = data;
            m_ajax.postJson(options,function (response) {

                if(response.code=='0'){
                    S_toastr.success('保存成功！');
                    that.renderDataList();
                }else {
                    S_toastr.error(response.info);
                }
            });
        }
        //事件绑定
        , bindActionClick:function () {
            var that = this;
            $(that.element).find('button[data-action]').off('click').on('click',function () {
                var $this = $(this);
                var dataAction = $this.attr('data-action');
                switch (dataAction){
                    case 'exportDetails'://导出
                        downLoadFile({
                            url:restApi.url_exportSalaryList,
                            data:filterParam(that._filterData),
                            type:1
                        });
                        return false;
                        break;
                    case 'generateReport'://生成综合报表
                        S_layer.confirm('请确认是否用当前“工资数据导入表”产生“个税计算查询表和工资计算总表”', function () {
                            var options={};
                            options.classId = that.element;
                            options.url=restApi.url_createSalaryReport;
                            options.postData = {
                                month : that._filterData.month,
                                companyId : that._filterData.companyId
                            };
                            m_ajax.postJson(options,function (response) {

                                if(response.code=='0'){
                                    S_toastr.success('操作成功！');
                                    that.renderDataList();
                                }else {
                                    S_toastr.error(response.info);
                                }
                            });
                        }, function () {
                        });

                        return false;
                        break;
                    case 'saveReport'://保存综合报表

                        S_layer.confirm('保存综合报表后，以当前月份“工资数据导入表”产生的“个税计算查询表和工资计算总表”将不可再修改，是否确认保存综合报表？', function () {
                            var options={};
                            options.classId = that.element;
                            options.url=restApi.url_saveSalaryReport;
                            options.postData = {
                                month : that._filterData.month,
                                companyId : that._filterData.companyId
                            };
                            m_ajax.postJson(options,function (response) {

                                if(response.code=='0'){
                                    S_toastr.success('操作成功！');
                                    that.renderDataList();
                                }else {
                                    S_toastr.error(response.info);
                                }
                            });
                        }, function () {
                        });

                        return false;
                        break;
                    case 'changeHistory'://变更记录
                        $('body').m_salary_history({month:that._filterData.month},true);
                        return false;
                        break;
                }
            });
            $(that.element).find('a[data-action="importDetails"]').m_fileUploader({
                server: restApi.url_importSalaryList,
                fileExts: 'xls,xlsx',
                fileSingleSizeLimit: 20 * 1024 * 1024,
                formData: {},
                innerHTML: '导入表格',
                loadingId: '#content-box .ibox',
                uploadBeforeSend: function (object, data, headers) {
                    data.month = that._filterData.month;
                    data.companyId = that._filterData.companyId;
                    if(that._filterData.companyUserId!=null)
                        data.companyUserId = that._filterData.companyUserId;
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
