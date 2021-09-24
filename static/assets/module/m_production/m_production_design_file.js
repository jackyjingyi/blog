/**
 * 项目信息－生产安排-设计文件
 * Created by wrb on 2019/6/28.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_production_design_file",
        defaults = {
            query:null,
            approvalOpinionData:null,
            projectName:null,
            projectId:null,
            dataCompanyId:null,
            taskId:null,
            dataInfo:null,
            doType:1,//1=生产详情,2=订单详情，3=项目详情,4=专业详情-图纸
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


        this._dataInfo = this.settings.dataInfo;

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_production/m_production_design_file',{
                dataInfo:that._dataInfo,
                doType:that.settings.doType,
                baBieUserId:window.baBie.userId,
                pageIndex:$(that.element).parent().find('.m-pagination').length>0?$(that.element).parent().find('.m-pagination').pagination('getPageIndex'):0
            });
            $(that.element).html(html);
            that.editHover();
            that.bindDesignFileEditable();
            that.initTaskFileCkICheck();
            that.bindActionClick();
            $(that.element).find('[data-toggle="tooltip"]').tooltip({trigger:'hover'});
        }
        //在位编辑内容初始化
        ,bindDesignFileEditable:function(){
            var that = this;
            $(that.element).find('a[data-action="xeditableUserByDesign"]').off('click').on('click',function () {
                var $this = $(this);
                var key = $this.attr('data-key');
                var value = [];
                var dataId = $this.closest('tr').attr('data-id');
                //获取节点数据
                var dataItem = getObjectInArray(that._dataInfo.attachList,dataId);
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
                var id = $this.closest('tr').attr('data-id');
                var dataItem = getObjectInArray(that._dataInfo.attachList,id);
                $('body').m_production_approval_opinion_state_flow({
                    doType:2,
                    dataInfo:dataItem,
                    projectId:that.settings.projectId,
                    saveCallBack:function () {
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

                    if(that.settings.saveCallBack)
                        that.settings.saveCallBack();
                }else {
                    S_layer.error(response.info);
                }
            })
        }
        //编辑生产状态
        ,changeDesignFileStatus:function (param) {
            var options={},that=this;
            options.url=restApi.url_projectSkyDriver_saveFileStatus;
            options.postData = {};
            $.extend(options.postData, param);
            m_ajax.postJson(options,function (response) {
                if(response.code=='0'){
                    S_toastr.success('保存成功！');
                    if(that.settings.saveCallBack)
                        that.settings.saveCallBack();
                }else {
                    S_toastr.error(response.info);

                }
            });
        }
        ,initTaskFileCkICheck:function () {
            var that = this;

            var isCheckedAll = function () {
                var lenCk = $(that.element).find('input[name="taskFileCk"][value!=""]:checked').length;
                var len = $(that.element).find('input[name="taskFileCk"][value!=""]').length;
                if(lenCk==len && len!=0){
                    $(that.element).find('input[name="taskFileCk"][value=""]').prop('checked',true);
                    $(that.element).find('input[name="taskFileCk"][value=""]').iCheck('update');
                }else{
                    $(that.element).find('input[name="taskFileCk"][value=""]').prop('checked',false);
                    $(that.element).find('input[name="taskFileCk"][value=""]').iCheck('update');
                }

            };
            var ifChecked = function (e) {
                if($(this).val()==''){
                    $(that.element).find('input[name="taskFileCk"]').prop('checked',true);
                    $(that.element).find('input[name="taskFileCk"]').iCheck('update');
                }
                isCheckedAll();
            };
            var ifUnchecked = function (e) {
                if($(this).val()==''){
                    $(that.element).find('input[name="taskFileCk"]').prop('checked',false);
                    $(that.element).find('input[name="taskFileCk"]').iCheck('update');
                }
                isCheckedAll();
            };
            var ifClicked = function (e) {

            };
            $(that.element).find('input[name="taskFileCk"]').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            }).on('ifUnchecked.s', ifUnchecked).on('ifChecked.s', ifChecked).on('ifClicked',ifClicked);
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
        //删除文件
        ,delFileItem:function (dataId,callBack) {
            var that = this;
            var option = {};
            option.url = restApi.url_projectSkyDriver_deleteFileById;
            option.postData = {};
            option.postData.id = dataId;
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
                switch (dataAction){

                    case 'deleteItem'://删除设计文件

                        S_layer.confirm('删除后将不能恢复，您确定要删除吗？', function () {

                            that.delFileItem(dataId);

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

                        var taskList = [];
                        taskList.push(dataId);
                        that.fileDownload(taskList);
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
                            S_toastr.error('请选择需要批量流转的设计文件！');
                            return false;
                        }
                        if(isSameState==false){
                            S_layer.error('当前选择的内容，状态不一致，请重新选择要批量流转的内容！');
                            return false;
                        }

                        var dataItemId = $(that.element).find('tr[data-id="'+taskList[0]+'"]').attr('data-id');
                        //获取节点数据
                        var dataItem = getObjectInArray(that._dataInfo.attachList,dataItemId);

                        $('body').m_production_approval_opinion_state_flow({
                            doType:2,
                            isBatch:true,
                            dataInfo:dataItem,
                            postParam:{idList:taskList},
                            postUrl:restApi.url_projectSkyDriver_batchSaveFileStatus,
                            projectId:that.settings.projectId,
                            saveCallBack:function () {
                                if(that.settings.saveCallBack)
                                    that.settings.saveCallBack();
                            }
                        },true);
                        return false;
                        break;

                    case 'batchDel'://删除

                        var taskList = [];
                        $(that.element).find('input[name="taskFileCk"][value!=""][data-is-del="1"]:checked').each(function (i) {
                            taskList.push($(this).val());
                        });
                        var checkLen = $(that.element).find('input[name="taskFileCk"][value!=""]:checked').length;
                        if(checkLen==0){
                            S_toastr.error('请选择需要批量删除的文件！');
                            return false;
                        }
                        if(taskList.length==0){
                            S_toastr.error('没有可以删除的文件（只能删除自己上传的文件），！');
                            return false;
                        }

                        S_layer.confirm('删除后将不能恢复，您确定要删除吗？', function () {

                            $.each(taskList,function (i,item) {

                                that.delFileItem(item,function () {
                                    if(i==taskList.length-1){
                                        if(that.settings.saveCallBack)
                                            that.settings.saveCallBack();
                                    }
                                });
                            });


                        }, function () {
                        });


                        break;
                    case 'batchDownload'://下载

                        var taskList = [];
                        $(that.element).find('input[name="taskFileCk"][value!=""]:checked').each(function (i) {
                            taskList.push($(this).val());
                        });
                        if(taskList.length==0){
                            S_toastr.error('请选择需要批量下载的文件！');
                            return false;
                        }

                        that.fileDownload(taskList);

                        break;

                }
            });
        }
        //下载
        ,fileDownload:function (idList) {
            $.each(idList,function (i,item) {
                var option  = {};
                option.async = false;
                option.url = restApi.url_getToken;
                option.postData = {userId:window.baBie.userId,fileId:item};
                if(window.role.isRootCompany==0){
                    option.postData.depId=window.baBie.depId;
                }else{
                    option.postData.entId=window.baBie.entId;
                }
                m_ajax.postJson(option,function (response) {
                    if(response.code=='0'){
                            m_ajax.get({
                                url:restApi.url_yun_getMaodingDownloadUrl+'?token='+encodeURIComponent(response.data)+'&fileId='+item
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
