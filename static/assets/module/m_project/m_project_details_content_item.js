/**
 * 项目信息－任务订单
 * Created by wrb on 2018/11/2.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_project_details_content_item",
        defaults = {
            projectId:null,
            projectName:null,
            dataInfo:null,//签发数据
            doType:1,//默认签发界面调用，2=详情调用
            dataCompanyId:null,//视图组织
            reRenderCallBack:null,
            saveCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._currentCompanyUserId = window.currentCompanyUserId;//员工ID
        this._currentCompanyId = window.currentCompanyId;//组织ID
        this._currentUserId = window.currentUserId;//用户ID
        this._fastdfsUrl = window.fastdfsUrl;//文件地址

        this._dataInfo = this.settings.dataInfo;//请求签发数据

        this._lastClickCheckBoxEle = null;//最后点击的checkbox all
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.renderContent();
        }

        //渲染签发列表
        ,renderContent:function () {
            var that = this;

            var $data = {};
            $data.projectId = that.settings.projectId;
            $data.projectNameCode = encodeURI(that.settings.projectName);
            $data.p = that._dataInfo;
            $data.dataCompanyId = that.settings.dataCompanyId;
            var html = template('m_project/m_project_details_content_item', $data);
            $(that.element).html(html);
            var width = ($(that.element).find('table.table').width())*0.5-20;
            if(that.settings.doType==2)
                width = ($(that.element).closest('.tabs-container').width()-43)*0.5-20;

            stringCtrl($('a.task-name'),width,true);
            that.initICheck();
            that.editHoverFun();
            that.bindTrActionClick();
            that.bindEditable();
            $(that.element).find('i[data-toggle="tooltip"]').tooltip();
        }
        //重新加载数据
        ,reRenderContent:function () {
            var that = this;

            /*//获取正在编辑的行
            var rowEditList = [];
            $(that.element).find('.content-row-edit').each(function () {

                var $prev = $(this).prev('tr');
                var prevId = $prev.attr('data-id');
                rowEditList.push({
                    prevId : prevId,
                    content : $(this).clone(true)
                })
            });*/

            if(that.settings.saveCallBack)
                that.settings.saveCallBack();

        }
        //事件绑定
        ,bindTrActionClick:function ($ele) {
            var that = this;
            if(isNullOrBlank($ele))
                $ele = $(that.element);
            $ele.find('a[data-action],button[data-action]').on('click', function (e) {
                var $this = $(this);
                var $panel = $this.closest('.panel');
                var dataAction = $this.attr('data-action');
                var dataPid = $this.closest('.panel').attr('data-id');
                var dataId = $this.closest('tr').attr('data-id');
                var dataI = $this.closest('tr').attr('data-i')-0;
                //获取节点数据
                var dataPidItem = that._dataInfo;
                var dataItem = getObjectInArray(dataPidItem.childList,dataId);
                switch (dataAction) {
                    case 'delTask'://删除任务
                        var idList = [];
                        idList.push(dataId);
                        that.batchDelTask(idList);
                        break;
                    case 'batchDelTask'://批量删除
                        var idList = [];
                        $panel.find('input[name="taskCk"][data-is-can2="1"]:checked').each(function () {
                            var id = $(this).closest('tr').attr('data-id');
                            idList.push(id);
                        });
                        if(idList.length>0){
                            that.batchDelTask(idList);
                        }else{
                            S_toastr.warning('当前不存在可删除的项目/子项，请重新选择！');
                        }
                        break;

                    case 'stateFlow'://状态流转

                        var endStatus = $this.attr('data-end-status');
                        if(endStatus==5){
                            $('body').m_task_issue_approval({
                                projectId:that.settings.projectId,
                                taskId:dataId,
                                saveCallBack:function () {
                                    that.reRenderContent();
                                },
                                closeCallBack:function () {
                                    that.reRenderContent();
                                }
                            },true);
                        }else{
                            $('body').m_task_issue_status_flow({
                                dataInfo:dataItem,
                                isShowStop:true,
                                saveCallBack:function () {
                                    that.reRenderContent();
                                }
                            },true);
                        }
                        break;

                }
                stopPropagation(e);
                return false;

            });
        }
        ,initICheck:function ($ele) {
            var that = this,isInitCheckAll = false;
            if(isNullOrBlank($ele)){
                $ele = $(that.element);
                isInitCheckAll = true
            }

            //判断全选是否该选中并给相关处理
            var dealAllCheck = function ($panel) {
                $panel.find('input[name="taskAllCk"]').each(function () {
                    var taskLen = $(this).closest('.panel').find('input[name="taskCk"]').length;
                    var taskCheckedLen = $(this).closest('.panel').find('input[name="taskCk"]:checked').length;
                    if(taskLen==taskCheckedLen && taskLen==taskCheckedLen!=0){
                        $panel.find('input[name="taskAllCk"]').prop('checked',true);
                        $panel.find('input[name="taskAllCk"]').iCheck('update');
                    }else{
                        $panel.find('input[name="taskAllCk"]').prop('checked',false);
                        $panel.find('input[name="taskAllCk"]').iCheck('update');
                    }
                });
            };
            var ifChecked = function (e) {

                if($(this).attr('data-is-can1')=='1' || $(this).attr('data-is-can2')=='1')
                    $(this).closest('tr').addClass('chose-operable');
                dealAllCheck($(this).closest('.panel'));
            };
            var ifUnchecked = function (e) {

                $(this).closest('tr').removeClass('chose-operable');
                dealAllCheck($(this).closest('.panel'));
            };
            $ele.find('input[name="taskCk"]').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            }).on('ifUnchecked.s', ifUnchecked).on('ifChecked.s', ifChecked);

            if(!isInitCheckAll)
                return false;


            var ifAllChecked = function (e) {

                $(this).closest('.panel').find('input[name="taskCk"][data-is-can1="1"],input[name="taskCk"][data-is-can2="1"]').closest('tr').addClass('chose-operable');
                $(this).closest('.panel').find('input[name="taskCk"]').prop('checked',true);
                $(this).closest('.panel').find('input[name="taskCk"]').iCheck('update');
            };
            var ifAllUnchecked = function (e) {

                $(this).closest('.panel').find('input[name="taskCk"][data-is-can1="1"],input[name="taskCk"][data-is-can2="1"]').closest('tr').removeClass('chose-operable');
                $(this).closest('.panel').find('input[name="taskCk"]').prop('checked',false);
                $(this).closest('.panel').find('input[name="taskCk"]').iCheck('update');
            };
            var ifAllClicked = function (e) {

            };
            $ele.find('input[name="taskAllCk"]').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            }).on('ifUnchecked.s', ifAllUnchecked).on('ifChecked.s', ifAllChecked).on('ifClicked',ifAllClicked);
        }
        //hover事件
        ,editHoverFun:function ($ele) {

            var that = this;
            if(isNullOrBlank($ele))
                $ele = $(that.element).find('tr');

            //文本移上去出现编辑图标hover事件
            $ele.find('a[data-action][data-deal-type="edit"],a[data-action="xeditable"]').each(function () {

                var $this = $(this);

                $this.closest('TD').hover(function () {
                    if(!($(this).find('.m-editable').length>0)){
                        $this.show();
                    }
                },function () {
                    if(!($(this).find('.m-editable').length>0)) {
                        $this.hide();
                    }
                })
            });
            //TR hover效果
            $ele.each(function () {

                var $this = $(this);
                var singleOperation = $this.find('.singleOperation');
                var batchOperation = $this.find('.batchOperation');

                $this.hover(function () {
                    if(batchOperation.length==0 || batchOperation.css('display')=='none'){
                        singleOperation.show();
                    }
                    if(!$this.hasClass('chose-operable')){
                        $this.addClass('tr-hover');
                    }

                },function () {
                    singleOperation.hide();
                    if(!$this.hasClass('chose-operable')){
                        $this.removeClass('tr-hover');
                    }
                });
            });
        }
        //在位编辑内容初始化
        ,bindEditable:function($ele){
            var that = this;
            if(isNullOrBlank($ele))
                $ele = $(that.element);

            $ele.find('a[data-action="xeditable"]').each(function () {
                var $this = $(this);
                var key = $this.attr('data-key');
                var value = $this.attr('data-value');
                var dataInfo = null;
                var noInternalInit = false;

                if(key=='companyId'){
                    noInternalInit = true;
                }
                $this.m_editable({
                    inline:true,
                    popoverClass : 'full-width',
                    hideElement:true,
                    isNotSet:false,
                    value:value,
                    dataInfo:dataInfo,
                    closed:function (data) {

                        if(data!=false){
                            var param = {};
                            param.id = $this.closest('tr').attr('data-id');
                            if(key=='taskName'){

                                param.companyId = $this.closest('tr').attr('data-company-id');
                                if(isNullOrBlank(data[key]))
                                    return false;

                            }else if(key=='startTime'){

                                param.isUpdateDate = 1;
                                param.endTime = $this.attr('data-max-date');

                            }else if(key=='endTime'){

                                param.isUpdateDate = 1;
                                param.startTime = $this.attr('data-min-date');
                            }

                            if(data[key]!=null){
                                param[key] = data[key];
                                that.updateProjectBaseData(param);
                            }
                        }
                        $this.parent().find('.show-span').show();
                    },
                    noInternalInit:noInternalInit,
                    completed:function ($popover) {
                        $(that.element).find('.show-span').show();
                        $this.parent().find('.show-span').hide();

                        if(key=='companyId'){
                            $popover.find('.m-editable-control').m_org_select({
                                isBtnSm:true,
                                orgParam:{projectId:that.settings.projectId},
                                dataInfo:{
                                    companyId:value,
                                    departId:$this.attr('data-depart-id'),
                                    orgName:$this.prev().text()
                                },
                                selectCallBack:function (data) {
                                    if(data!=null){

                                        var dataChange = $this.attr('data-change');
                                        var saveFun = function () {
                                            var param = {};
                                            param.id = $this.closest('tr').attr('data-id');
                                            param.companyId = data.companyId;
                                            param.orgId = data.departId;
                                            param.isChangeOrg = 1;
                                            that.saveTaskIssue(param);

                                        };
                                        if(dataChange==1){
                                            saveFun();
                                        }else{
                                            S_layer.confirm('旧组织所产生的生产数据将不可恢复，您确定要切换吗？', function () {
                                                saveFun();
                                            }, function () {
                                            });
                                        }
                                    }
                                }
                            },true);
                        }
                    }
                },true);
            });
        }
        //批量删除任务
        ,batchDelTask:function (idList) {
            var that = this;
            S_layer.confirm('删除后将不能恢复，您确定要删除吗？', function () {
                var option = {};
                option.url = restApi.url_deleteProjectTask;
                option.postData = {};
                option.postData.idList = idList;
                m_ajax.postJson(option, function (response) {
                    if (response.code == '0') {
                        S_toastr.success('删除成功！');
                        that.reRenderContent();
                    } else {
                        S_layer.error(response.info);
                    }
                });

            }, function () {
            });
        }
        //渲染列表行
        ,renderContentRow:function (data,$panel,dataPidItem) {
            var that = this;
            var html = template('m_project/m_project_details_content_row', {t:data,tIndex:dataPidItem.childList.length-1,tLength:dataPidItem.childList.length,p:dataPidItem,projectId:that.settings.projectId,projectNameCode:encodeURI(that.settings.projectName)});
            var $lastTr = $panel.find('tr.content-row:last');
            if($lastTr.length==0){
                $panel.find('tbody').prepend(html);
            }else{
                $panel.find('tr.content-row:last').after(html);
            }

            stringCtrl($panel.find('a.task-name:last'),($(that.element).find('table.table').width())*0.26,true);
            that.initICheck($panel.find('tr.content-row:last'));
            that.editHoverFun($panel.find('tr.content-row:last'));
            that.bindTrActionClick($panel.find('tr.content-row:last'));
            that.bindEditable($panel.find('tr.content-row:last'));
        }
        //编辑签发保存
        ,saveTaskIssue:function (param) {
            var options={},that=this;
            options.url=restApi.url_saveTaskIssuing;
            options.postData = {};
            options.postData.projectId = that.settings.projectId;
            options.postData.taskType =2;
            $.extend(options.postData, param);
            m_ajax.postJson(options,function (response) {
                if(response.code=='0'){
                    S_toastr.success('保存成功！');
                    that.reRenderContent();
                }else {
                    if(response.info.indexOf('已存在')>-1){
                        S_toastr.error(response.info);
                    }else{
                        S_layer.error(response.info);
                    }
                }
            });
        }
        //编辑签发保存
        ,updateProjectBaseData:function (param) {
            var options={},that=this;
            options.url=restApi.url_updateProjectBaseData;
            options.postData = {};
            options.postData.projectId = that.settings.projectId;
            options.postData.taskType =2;
            $.extend(options.postData, param);
            m_ajax.postJson(options,function (response) {
                if(response.code=='0'){
                    S_toastr.success('保存成功！');
                    that.reRenderContent();
                }else {
                    if(response.info.indexOf('已存在')>-1){
                        S_toastr.error(response.info);
                    }else{
                        S_layer.error(response.info);
                    }
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
