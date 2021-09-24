/**
 * 我的任务－设计文件
 * Created by wrb on 2020/02/27.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_task_design_file",
        defaults = {
            status:null,//0=待办，1=已办
            projectId:null,//项目ID
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

        this._dataInfo = {};//请求签发数据

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var options={};
            options.classId = '#content-right';
            options.url=restApi.url_listMyTaskForDesignFile;
            options.postData = {
                status:that.settings.status,
                projectId:that.settings.projectId
            };
            m_ajax.postJson(options,function (response) {

                if(response.code=='0'){

                    that._dataInfo = response.data.data;
                    var html = template('m_task/m_task_design_file',{
                        projectId:that._projectId,
                        projectName:that._projectName,
                        taskId:that.settings.taskId,
                        dataList:response.data.data
                    });
                    $(that.element).html(html);
                    that.editHover();
                    that.bindDesignFileEditable();
                    that.initTaskFileCkICheck();
                    that.bindActionClick();
                    $(that.element).find('[data-toggle="tooltip"]').tooltip({trigger:'hover'});

                }else {
                    S_layer.error(response.info);
                }
            });

        }
        //在位编辑内容初始化
        ,bindDesignFileEditable:function(){
            var that = this;
            $(that.element).find('a[data-action="xeditableUserByDesign"]').off('click').on('click',function () {
                var $this = $(this);
                var key = $this.attr('data-key');
                var value = [];
                var dataId = $this.closest('tr').attr('data-id');
                var dataPid = $this.closest('tr').attr('data-pid');
                //获取节点数据
                var dataParentItem = getObjectInArray(that._dataInfo,dataPid);
                var dataItem = getObjectInArray(dataParentItem.fileList,dataId);
                var list = dataItem.handlerUser.userList;
                $.each(list,function (i,item) {
                    value.push({id:item.companyUserId,text:item.userName})
                });

                $this.m_editable_select_users({
                    value:value,
                    postParam:{projectId:that.settings.projectId},
                    controlClass:'input-sm',
                    closed:function (data,$popover) {

                        if(data!==false) {
                            if (isNullOrBlank(data))
                                data = [];

                            var getUserIdList = function (list) {
                                list = [];
                                $.each(data, function (i, item) {
                                    list.push(item.id)
                                });
                                return list;
                            };
                            var param = {};
                            param.type = 1;
                            param.targetId = dataId;
                            param.companyUserList = getUserIdList(data);
                            that.editDesignFileHandlerUser(param);
                            $this.m_editable_select_users('setCookiesByUsers', {userList: data});
                        }
                        $this.parent().find('.show-span').show();
                    },
                    completed:function ($popover) {
                        $('.show-span').show();
                        $this.parent().find('.show-span').hide();

                    }
                },true);
            });
            $(that.element).find('a[data-action="xeditableByDesignClick"]').off('click').on('click',function () {
                var $this = $(this);
                var key = $this.attr('data-key');
                var value = $.trim($this.attr('data-value'));
                var dataId = $this.closest('tr').attr('data-id');
                var dataPid = $this.closest('tr').attr('data-pid');
                //获取节点数据
                var dataParentItem = getObjectInArray(that._dataInfo,dataPid);
                var dataItem = getObjectInArray(dataParentItem.fileList,dataId);

                $('body').m_production_approval_opinion_state_flow({
                    doType:2,
                    dataInfo:dataItem,
                    projectId:that.settings.projectId,
                    saveCallBack:function () {
                        that.init();
                        if(that.settings.saveCallBack)
                            that.settings.saveCallBack();
                    }
                },true);
                return false;
            });
        }
        //保存处理人
        ,editDesignFileHandlerUser:function(data,event){
            var that = this;
            var option={};
            option.url=restApi.url_projectSkyDriver_saveProjectFileHandlerMember;
            option.classId = '#content-right';
            option.postData={};
            option.postData.targetId = data.targetId;
            option.postData.projectId=that.settings.projectId;
            option.postData.companyId=that._currentCompanyId;
            option.postData.type=data.type;
            option.postData.companyUserList=data.companyUserList;
            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){
                    S_toastr.success('保存成功！');
                    that.init();
                    if(that.settings.saveCallBack)
                        that.settings.saveCallBack();
                }else {
                    S_layer.error(response.info);
                }
            })
        }
        ,initTaskFileCkICheck:function () {
            var that = this;

            var　checkAll = function ($this) {

                var checkedLen = $(that.element).find('input[name="taskFileCk"][value!=""]:checked').length;
                var taskLen = $(that.element).find('input[name="taskFileCk"][value!=""]').length;
                if(checkedLen==taskLen){
                    $(that.element).find('input[name="taskFileCk"][value=""]').prop('checked',true);
                    $(that.element).find('input[name="taskFileCk"][value=""]').iCheck('update');
                }else{
                    $(that.element).find('input[name="taskFileCk"][value=""]').prop('checked',false);
                    $(that.element).find('input[name="taskFileCk"][value=""]').iCheck('update');
                }
            };
            var ifChecked = function (e) {

                var $this = $(this);
                if(isNullOrBlank($this.attr('value'))){//全选
                    $(that.element).find('input[name="taskFileCk"][value!=""]').prop('checked',true);
                    $(that.element).find('input[name="taskFileCk"][value!=""]').iCheck('update');
                }
                checkAll($this);
            };
            var ifUnchecked = function (e) {
                var $this = $(this);
                if(isNullOrBlank($this.attr('value'))){//全不选
                    $(that.element).find('input[name="taskFileCk"][value!=""]').prop('checked',false);
                    $(that.element).find('input[name="taskFileCk"][value!=""]').iCheck('update');
                }
                checkAll($this);
            };
            $(that.element).find('input[name="taskFileCk"]').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            }).on('ifUnchecked.s', ifUnchecked).on('ifChecked.s', ifChecked);
        }
        //hover事件-展示编辑按钮
        ,editHover:function () {
            var that = this;
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
        }
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('a[data-action]').on('click',function (e) {
                var $this = $(this),dataAction = $this.attr('data-action');
                var dataId = $this.closest('tr').attr('data-id');
                switch (dataAction){

                    case 'deleteItem'://删除设计文件

                        S_layer.confirm('删除后将不能恢复，您确定要删除吗？', function () {
                            var option = {};
                            option.url = restApi.url_projectSkyDriver_deleteFileById;
                            option.postData = {};
                            option.postData.id = dataId;
                            m_ajax.postJson(option, function (response) {
                                if (response.code == '0') {
                                    S_toastr.success('删除成功！');
                                    that.init();
                                    if(that.settings.saveCallBack)
                                        that.settings.saveCallBack();
                                } else {
                                    S_layer.error(response.info);
                                }
                            });

                        }, function () {
                        });

                        return false;
                        break;

                    case 'filePreview':

                        //$('body').m_yun_file_preview({fileId:dataId});
                        var param = {
                            fileId:dataId,
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
                        break;

                    case 'fileDownload':

                        var option  = {};
                        option.async = false;
                        option.url = restApi.url_getToken;
                        option.postData = {userId:window.baBie.userId};
                        m_ajax.postJson(option,function (response) {
                            if(response.code=='0'){

                                m_ajax.get({
                                    url:restApi.url_yun_getMaodingDownloadUrl+'?token='+encodeURI(response.data)+'&fileId='+dataId
                                }, function (res) {
                                    if (res.code == '0') {

                                        downLoadFile({
                                            url:res.url
                                        });

                                    } else {
                                        S_layer.error(res.info);
                                    }
                                });

                            }else {
                                S_layer.error(response.info);
                            }
                        });


                        break;

                    case 'batchStateFlow'://批量流转
                        var taskList = [],isSameState=true,stateStr='';
                        $(that.element).find('input[name="taskFileCk"][value!=""]:checked').each(function (i) {
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

                        var dataPid = $(that.element).find('tr[data-id="'+taskList[0]+'"]').attr('data-pid');
                        //获取节点数据
                        var dataParentItem = getObjectInArray(that._dataInfo,dataPid);
                        var dataItem = getObjectInArray(dataParentItem.fileList,taskList[0]);

                        $('body').m_production_approval_opinion_state_flow({
                            doType:2,
                            isBatch:true,
                            dataInfo:dataItem,
                            postParam:{idList:taskList},
                            postUrl:restApi.url_projectSkyDriver_batchSaveFileStatus,
                            projectId:that.settings.projectId,
                            saveCallBack:function () {
                                that.init();
                            }
                        },true);
                        return false;
                        break;

                }
            });
        }

    });

    $.fn[pluginName] = function (options) {
        return this.each(function () {
            // if (!$.data(this, "plugin_" + pluginName)) {
            $.data(this, "plugin_" +
                pluginName, new Plugin(this, options));
            // }
        });
    };

})(jQuery, window, document);
