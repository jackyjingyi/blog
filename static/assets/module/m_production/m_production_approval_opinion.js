/**
 * 项目信息－生产安排-校审列表
 * Created by wrb on 2018/10/23.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_production_approval_opinion",
        defaults = {
            query:null,
            approvalOpinionData:null,
            projectName:null,
            projectId:null,
            dataCompanyId:null,
            taskId:null,
            dataInfo:null,
            saveCallBack:null,
            doType:0//0=生产详情，1=我的任务,2=专业详情-校审意见


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


        this._approvalOpinionData = this.settings.approvalOpinionData;
        this._dataInfo = this.settings.dataInfo;


        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_production/m_production_approval_opinion',{
                dataList:that._approvalOpinionData,
                doType:that.settings.doType
            });
            $(that.element).html(html);

            that.initApprovalOpinionCkICheck();
            that.editHover();
            that.bindApprovalOpinionClick();
            that.bindActionClick();
        }
        ,initApprovalOpinionCkICheck:function () {
            var that = this;

            var name = 'approvalOpinionCk';
            var isCheckedAll = function () {
                var lenCk = $(that.element).find('input[name="approvalOpinionCk"][value!=""]:checked').length;
                var len = $(that.element).find('input[name="approvalOpinionCk"][value!=""]').length;
                if(lenCk==len && len!=0){
                    $(that.element).find('input[name="approvalOpinionCk"][value=""]').prop('checked',true);
                    $(that.element).find('input[name="approvalOpinionCk"][value=""]').iCheck('update');
                }else{
                    $(that.element).find('input[name="approvalOpinionCk"][value=""]').prop('checked',false);
                    $(that.element).find('input[name="approvalOpinionCk"][value=""]').iCheck('update');
                }

            };
            var ifChecked = function (e) {
                if($(this).val()==''){
                    $(that.element).find('input[name="approvalOpinionCk"]').prop('checked',true);
                    $(that.element).find('input[name="approvalOpinionCk"]').iCheck('update');
                }
                isCheckedAll();
            };
            var ifUnchecked = function (e) {
                if($(this).val()==''){
                    $(that.element).find('input[name="approvalOpinionCk"]').prop('checked',false);
                    $(that.element).find('input[name="approvalOpinionCk"]').iCheck('update');
                }
                isCheckedAll();
            };
            var ifClicked = function (e) {

            };
            $(that.element).find('input[name="approvalOpinionCk"]').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            }).on('ifUnchecked.s', ifUnchecked).on('ifChecked.s', ifChecked).on('ifClicked',ifClicked);
        }
        //在位编辑内容初始化
        ,bindApprovalOpinionClick:function(){
            var that = this;
            $(that.element).find('a[data-action="xeditableByApprovalOpinion"]').each(function () {
                var $this = $(this),dataId = $this.closest('tr').attr('data-id');
                var key = $this.attr('data-key');
                var value = $.trim($this.attr('data-value'));
                var dataInfo = null;
                var dataItem = getObjectInArray(that._approvalOpinionData,dataId);

                if(key=='severity'){

                    //1:致命，2：严重，3：一般，4：提示，5：建议
                    dataInfo = [
                        {id: 0, name: '空'},
                        {id: 1, name: '致命'},
                        {id: 2, name: '严重'},
                        {id: 3, name: '一般'},
                        {id: 4, name: '提示'},
                        {id: 5, name: '建议'}];

                    $.each(dataInfo,function (i,item) {
                        if(item.id==value)
                            item.isSelected = true;
                    });
                }

                $this.m_editable({
                    inline:true,
                    popoverClass : 'full-width',
                    hideElement:true,
                    value:value,
                    dataInfo:dataInfo,
                    isNotSet:false,
                    postParam:{projectId:that.settings.projectId},
                    targetNotQuickCloseArr:['select2-selection__choice','select2-search--dropdown','select2-search__field','select2-results__options','btn-edit'],
                    closed:function (data,$popover) {
                        if(data!=false){

                            var param = {};
                            param.id = $this.closest('tr').attr('data-id');
                            param.isUpdateExecuters = 0;
                            if(data[key]!=null){

                                param[key] = data[key];
                                that.saveApprovalOpinion(param);
                            }
                        }
                        $this.parent().find('.show-span').show();
                    },
                    completed:function ($popover) {
                        $(that.element).find('.show-span').show();
                        $this.parent().find('.show-span').hide();
                    }
                },true);
            });
            $(that.element).find('a[data-action="xeditableStatusByApprovalOpinion"]').off('click').on('click',function () {
                var $this = $(this);
                var dataId = $this.closest('tr').attr('data-id');
                var dataItem = getObjectInArray(that._approvalOpinionData,dataId);
                $('body').m_production_approval_opinion_state_flow({
                    dataInfo:dataItem,
                    //handler:data,
                    projectId:that.settings.projectId,
                    saveCallBack:function () {
                        if(that.settings.saveCallBack)
                            that.settings.saveCallBack();
                    }
                },true);
                return false;
            });
            $(that.element).find('a[data-action="xeditableUserByApprovalOpinion"]').off('click').on('click',function () {
                var $this = $(this);
                var key = $this.attr('data-key');
                var value = [];
                var dataId = $this.closest('tr').attr('data-id');
                //获取节点数据
                var dataItem = getObjectInArray(that._approvalOpinionData,dataId);
                if($this.parent().find('span.fc-v1-grey').length==0){//已设置
                    $.each(dataItem.executers,function (i,item) {
                        value.push({id:item.userId,text:item.userName});
                    });
                }
                $this.m_editable_select_users({
                    value:value,
                    isBaBieUserId:true,
                    postParam:{projectId:that.settings.projectId},
                    controlClass:'input-sm',
                    closed:function (data,$popover) {

                        if(data!==false){
                            if(isNullOrBlank(data))
                                data = [];
                            var getUserIdList = function (list) {
                                list = [];
                                $.each(data,function (i,item) {
                                    list.push(item.id)
                                });
                                return list;
                            };
                            var param = {};
                            param.isUpdateExecuters = 1;
                            param.id = dataId;
                            param.handler = getUserIdList(data).join(',');
                            that.saveApprovalOpinion(param);
                            $this.m_editable_select_users('setCookiesByUsers',{userList:data});
                        }
                        $this.parent().find('.show-span').show();

                    },
                    completed:function ($popover,userList) {
                        $('.show-span').show();
                        $this.parent().find('.show-span').hide();

                    }
                },true);
                return false;
            });

            $(that.element).find('table tbody tr[data-id]').on('click',function (e) {

                var $this = $(this);
                var flag1 = $(e.target).closest('.m-editable').length>0 || $(e.target).hasClass('.btn-edit');
                var flag2 = $(e.target).hasClass('.editable-click') || $(e.target).closest('.editable-click').length>0;
                var flag3 = $(e.target).hasClass('.list-action-box') || $(e.target).closest('.list-action-box').length>0;

                if(flag1 || flag2 || flag3)
                    return;

                if($(that.element).find('.m-editable').length>0)//当前存在编辑状态下
                    return;

                /*location.hash = getUrlParamStr('/project/production/approvalOpinionDetail',{
                    id:that.settings.projectId,
                    projectName:encodeURI(that.settings.projectName),
                    dataCompanyId:that.settings.dataCompanyId,
                    taskId:$this.attr('data-task-id'),
                    auditId:$this.attr('data-id'),
                    doType:that.settings.doType
                });*/

                var param = {
                    fileId:$this.attr('data-file-id'),
                    userId:window.baBie.userId
                };
                if(window.role.isRootCompany==0){
                    param.depId=window.baBie.depId;
                }else{
                    param.entId=window.baBie.entId;
                }
                var option  = {};
                option.async = false;
                option.url = restApi.url_getToken;
                option.postData = param;
                m_ajax.postJson(option,function (response) {
                    if(response.code=='0'){

                        param.token=encodeURIComponent(response.data);
                        var url = getUrlParamStr(restApi.url_yun_openMaodingFile,param);
                        window.open(url);

                    }else {
                        S_layer.error(response.info);
                    }
                });
            });
        }
        //保存校审意见
        ,saveApprovalOpinion:function (data) {
            var options={},that=this;

            options.url=restApi.url_saveApprovalOpinion;
            options.classId = '#content-right';
            options.postData = data;

            m_ajax.postJson(options,function (response) {

                if(response.code=='0'){
                    S_toastr.success('操作成功！');

                    if(that.settings.saveCallBack)
                        that.settings.saveCallBack();

                }else {
                    S_layer.error(response.info);
                }
            })
        }
        //hover事件-展示编辑按钮
        ,editHover:function () {

            var that = this;
            //文本移上去出现编辑图标hover事件
            $(that.element).find('a.btn-edit[data-action]').each(function () {

                var $this = $(this);
                $this.closest('TD').hover(function () {
                    if(!($(this).find('.m-editable').length>0)){
                        $this.css('visibility','visible');
                    }
                },function () {
                    if(!($(this).find('.m-editable').length>0)) {
                        $this.css('visibility','hidden');
                    }
                })
            });

            $(that.element).find('TR').each(function () {
                var $this = $(this);
                var singleOperation = $this.find('.singleOperation');
                $this.hover(function () {
                    singleOperation.show();

                },function () {
                    singleOperation.hide();
                });
            });
        }
        //删除校审意见
        ,delApprovalOpinion:function (data,callBack) {
            var that = this;
            var option = {};
            option.url = restApi.url_deleteApprovalOpinion;
            option.postData = data;
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    S_toastr.success('删除成功！');
                    if(callBack){
                        callBack();
                    }else if(that.settings.saveCallBack){
                        that.settings.saveCallBack();
                    }
                } else {
                    S_layer.error(response.info);
                }
            });
        }
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('a[data-action]').on('click',function (e) {
                var $this = $(this),dataAction = $this.attr('data-action');
                var dataId = $this.closest('tr').attr('data-id');
                var fileId = $this.closest('tr').attr('data-file-id');
                switch (dataAction){

                    case 'deleteItem'://删除设计文件

                        S_layer.confirm('删除后将不能恢复，您确定要删除吗？', function () {

                            that.delApprovalOpinion({id:dataId,fileId:fileId});

                        }, function () {
                        });


                        break;
                    case 'batchStateFlow'://批量流转
                        var taskList = [],isSameState=true,stateStr='';
                        $(that.element).find('input[name="approvalOpinionCk"][value!=""]:checked').each(function (i) {
                            taskList.push($(this).val());

                            var status = $(this).attr('data-status');
                            if(i==0){
                                stateStr = status;
                            }
                            if(stateStr!=status){
                                isSameState = false;
                            }
                        });

                        if(taskList.length==0){
                            S_toastr.error('请选择需要批量流转的任务！');
                            return false;
                        }
                        if(isSameState==false){
                            S_layer.error('当前选择的内容，状态不一致，请重新选择要批量流转的内容！');
                            return false;
                        }

                        var $tr = $(that.element).find('tr[data-id="'+taskList[0]+'"]');
                        var dataItemId = $tr.attr('data-id');
                        //获取节点数据
                        var dataItem = getObjectInArray(that._approvalOpinionData,dataItemId);

                        $('body').m_production_approval_opinion_state_flow({
                            doType:1,
                            isBatch:true,
                            dataInfo:dataItem,
                            postParam:{idList:taskList},
                            postUrl:restApi.url_batchChangeOpinionStatus,
                            projectId:that.settings.projectId,
                            saveCallBack:function () {
                                if(that.settings.saveCallBack)
                                    that.settings.saveCallBack();
                            }
                        },true);
                        break;

                    case 'batchDel'://批量删除

                        var taskList = [];
                        $(that.element).find('input[name="approvalOpinionCk"][value!=""]:checked').each(function (i) {
                            taskList.push({id:$(this).val(),fileId:$(this).closest('tr').attr('data-file-id')});
                        });

                        if(taskList.length==0){
                            S_toastr.error('请选择需要批量删除的校审意见！');
                            return false;
                        }

                        S_layer.confirm('删除后将不能恢复，您确定要删除吗？', function () {

                            $.each(taskList,function (i,item) {

                                that.delApprovalOpinion(item,function () {
                                    if(i==taskList.length-1){
                                        if(that.settings.saveCallBack)
                                            that.settings.saveCallBack();
                                    }
                                });
                            });
                        }, function () {
                        });

                        break;
                }
                return false;
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
