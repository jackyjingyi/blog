/**
 * 项目信息－生产安排-校审详情
 * Created by wrb on 2018/10/23.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_production_approval_opinion_details",
        defaults = {
            query:null
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
        this._leftBoxHeightResize = null;//左边div高度自适应设定初始对象
        this._dataInfo = {};//请求数据

        this.settings.query.projectName = encodeURI(this.settings.query.projectName);
        this._breadcrumb = [
            {
                name:'我的项目'
            },
            {
                name:decodeURI(this.settings.query.projectName),
                url:getUrlParamStr('#/project/basicInfo',{
                    id:this.settings.query.id,
                    projectName:this.settings.query.projectName,
                    dataCompanyId:this.settings.query.dataCompanyId
                })
            },
            {
                name:'生产安排',
                url:getUrlParamStr('#/project/production',{
                    id:this.settings.query.id,
                    projectName:this.settings.query.projectName,
                    dataCompanyId:this.settings.query.dataCompanyId
                })
            },
            {
                name:'生产安排详情',
                url:getUrlParamStr('#/project/production/details',{
                    id:this.settings.query.id,
                    projectName:this.settings.query.projectName,
                    dataCompanyId:this.settings.query.dataCompanyId,
                    taskId:this.settings.query.taskId
                })
            },
            {
                name:'校审详情'
            }
        ];

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.getData(function () {
                that.renderContent();
            });
        },
        //渲染初始界面
        getData:function (callBack) {
            var that = this;
            var options={};
            options.classId = '#content-right';
            options.url=restApi.url_getApprovalOpinionDetail;
            options.postData = {
                id:that.settings.query.auditId
            };
            m_ajax.postJson(options,function (response) {

                if(response.code=='0'){

                    that._dataInfo = response.data;
                    if(that._dataInfo.nodeList){
                        var nodeList = [],newNodeList = [];
                        $.each(that._dataInfo.nodeList,function (i,item) {
                            if(item.nodeValue==that._dataInfo.approvalOpinion.status){
                                nodeList.push(item);
                            }else{
                                newNodeList.push(item);
                            }
                        });
                        that._dataInfo.nodeList = nodeList.concat(newNodeList)
                    }

                    if(callBack)
                        callBack();

                }else {
                    S_layer.error(response.info);
                }
            });
        }
        //渲染内容
        ,renderContent:function (t) {
            var that = this;
            var html = template('m_production/m_production_approval_opinion_details',{
                dataInfo:that._dataInfo,
                query:that.settings.query

            });
            $(that.element).html(html);

            if($(that.element).find('#breadcrumb').length>0)
                $(that.element).find('#breadcrumb').m_breadcrumb({dataList:that._breadcrumb},true);

            //渲染文件列表
            if(that._dataInfo && that._dataInfo.attachList){
                $.each(that._dataInfo.attachList,function (i,item) {
                    var fileData = {
                        netFileId: item.netFileId,
                        fileName: item.fileName,
                        fullPath: item.fileFullPath
                    };
                    that.renderAttach(fileData);
                });
            }

            that.renderChangeHistory();
            that.bindFileUpload();
            that.bindActionClick();
            that.initSelect2ByUser();
            that.editTaskHoverFun();
            that.bindEditable();

            that._leftBoxHeightResize = new leftBoxHeightResize($(that.element).find('#leftBox'),$(that.element).find('#leftBox'),$(that.element).find('#rightBox'),106,false);
            that._leftBoxHeightResize.init();

            $(that.element).find('a[data-toggle="tab"]').on('click',function () {
                that._leftBoxHeightResize.setHeight();
            });

            $(that.element).find('button[data-node-type="1"]').on('click',function () {
                $(this).removeClass('fc-v1-grey').addClass('selected').siblings().removeClass('selected').addClass('fc-v1-grey');

                return false;
            });


        }

        //评论hover展示删除
        ,commentHover:function () {
            var that = this;
            $(that.element).find('div.comment-box').hover(function () {
                $(this).find('a[data-action="delComment"]').removeClass('hide');
            },function () {
                $(this).find('a[data-action="delComment"]').addClass('hide');
            });
        }
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('a[data-action],button[data-action]').off('click').on('click',function (e) {
                var $this = $(this),dataAction = $this.attr('data-action');
                var dataId = $this.closest('tr').attr('data-id');
                var dataI = $this.closest('tr').attr('data-i')-0;

                switch (dataAction){

                    case 'submitComment'://添加评论

                        var handler = $(that.element).find('select[name="handler"]').val();
                        var status = $(that.element).find('form button.selected[data-node-type]').attr('data-status');

                        /*if(isNullOrBlank(handler)){
                            S_toastr.error('请设置处理人');
                            return false;
                        }*/
                        if(!isNullOrBlank(handler))
                            handler = handler.join(',');

                        var option={};
                        option.classId = '#content-right';
                        option.url=restApi.url_saveApprovalOpinion;
                        option.postData = {
                            id:that.settings.query.auditId,
                            comment:$(that.element).find('form#commentForm textarea[name="comment"]').val(),
                            handler:handler,
                            status:status
                        };
                        var userList = $(that.element).find('select[name="handler"]').select2('data');
                        if(!isNullOrBlank(userList))
                            $(that.element).find('select[name="handler"]').m_select2_by_search('setSelect2CookiesByUsers',{userList:userList});

                        m_ajax.postJson(option,function (response) {

                            if(response.code=='0'){
                                S_toastr.success('操作成功！');
                                that.init();
                            }else {
                                S_layer.error(response.info);
                            }
                        });

                        return false;
                        break;
                    case 'delComment'://删除评论

                        var option={};
                        option.classId = '#content-right';
                        option.url=restApi.url_deleteTaskComment;
                        option.postData = {
                            id:$this.attr('data-id')
                        };
                        m_ajax.postJson(option,function (response) {

                            if(response.code=='0'){
                                S_toastr.success('操作成功！');
                                that.init();
                            }else {
                                S_layer.error(response.info);
                            }
                        });

                        return false;
                        break;

                    case 'deleteItem'://删除

                        S_layer.confirm('删除后将不能恢复，您确定要删除吗？', function () {
                            var option = {};
                            option.url = restApi.url_deleteApprovalOpinion;
                            option.postData = {};
                            option.postData.id = that._dataInfo.approvalOpinion.id;
                            m_ajax.postJson(option, function (response) {
                                if (response.code == '0') {
                                    S_toastr.success('删除成功！');

                                    location.hash = getUrlParamStr('/project/production/details',{
                                        id:that.settings.query.id,
                                        projectName:that.settings.query.projectName,
                                        dataCompanyId:that.settings.query.dataCompanyId,
                                        taskId:that.settings.query.taskId
                                    })

                                } else {
                                    S_layer.error(response.info);
                                }
                            });

                        }, function () {
                        });

                        break;
                    case 'preview'://附件预览

                        window.open($this.attr('data-src'));
                        return false;
                        break;

                }
            });


        }
        //渲染变更记录
        ,renderChangeHistory:function () {
            var that = this;
            var option = {};
            option.param = {};
            option.param.historyId = that.settings.query.auditId;
            paginationFun({
                eleId: '.tab-pane[data-type="changeHistory"] #data-pagination-container',
                loadingId: '.tab-pane[data-type="changeHistory"] .data-list-box',
                url: restApi.url_listHistory,
                params: option.param
            }, function (response) {

                if (response.code == '0') {

                    var html = template('m_task_issue/m_task_issue_details_history',{
                        dataList:response.data.data,
                        pageIndex:$(that.element).find('.tab-pane[data-type="changeHistory"] #data-pagination-container').pagination('getPageIndex')
                    });
                    $(that.element).find('.tab-pane[data-type="changeHistory"] .data-list-container').html(html);

                    //任务签发-查看描述
                    $(that.element).find('.tab-pane[data-type="changeHistory"] a[data-action="viewTaskRemark"]').on('click',function () {
                        //获取节点数据
                        var dataId = $(this).closest('tr').attr('data-id');
                        var historyItem = getObjectInArray(response.data.data,dataId);
                        var detailKey = $(this).attr('data-key');
                        $('body').m_task_issue_view_remark({
                            remark:historyItem[detailKey]
                        },true);
                        return false;
                    })
                } else {
                    S_layer.error(response.info);
                }
            });
        }
        ,bindFileUpload:function () {
            var that =this;
            var option = {};
            that._uploadmgrContainer = $(that.element).find('.uploadmgrContainer:eq(0)');
            option.server = restApi.url_attachment_uploadApprovalOpinionAttach;
            option.accept={
                title: '上传附件',
                extensions: '*',
                mimeTypes: '*'
            };
            option.btnPickText = '<i class="fa fa-upload"></i>&nbsp;上传附件';
            option.ifCloseItemFinished = true;
            option.boxClass = 'no-borders';
            option.isShowBtnClose = false;
            option.uploadBeforeSend = function (object, data, headers) {
                data.companyId = window.currentCompanyId;
                data.accountId = window.currentUserId;
                data.targetId = that.settings.query.auditId;
            };
            option.uploadSuccessCallback = function (file, response) {
                var fileData = {
                    netFileId: response.data.netFileId,
                    fileName: response.data.fileName,
                    fullPath: window.fastdfsUrl + response.data.fastdfsGroup + '/' + response.data.fastdfsPath
                };
                var $uploadItem = that._uploadmgrContainer.find('.uploadItem_' + file.id + ':eq(0)');
                if (!isNullOrBlank(fileData.netFileId)) {
                    $uploadItem.find('.span_status:eq(0)').html('上传成功');
                    that.renderAttach(fileData);

                } else {
                    $uploadItem.find('.span_status:eq(0)').html('上传失败');
                }

            };
            that._uploadmgrContainer.m_uploadmgr(option, true);
        }
        ,renderAttach:function (fileData) {
            var that = this;
            var html = template('m_common/m_attach', fileData);
            $('#showFileLoading').append(html);
            var obj = 'a[data-net-file-id="' + fileData.netFileId + '"]';
            that.bindAttachDelele();
            $('#showFileLoading').find('a[data-action="preview"]').off('click').on('click',function () {
                window.open($(this).attr('data-src'));
            });
        }
        ,bindAttachDelele: function () {
            $.each($('#showFileLoading').find('a[data-action="deleteAttach"]'), function (i, o) {
                $(o).off('click.deleteAttach').on('click.deleteAttach', function () {
                    var netFileId = $(this).attr('data-net-file-id');

                    var ajaxDelete = function () {
                        var ajaxOption = {};
                        ajaxOption.classId = '.file-list:eq(0)';
                        ajaxOption.url = restApi.url_attachment_delete;
                        ajaxOption.postData = {
                            id: netFileId,
                            accountId: window.currentUserId
                        };
                        m_ajax.postJson(ajaxOption, function (res) {
                            if (res.code === '0') {
                                S_toastr.success("删除成功");
                            } else if (res.code === '1') {
                                S_layer.error(res.msg);
                            }
                        });
                    };
                    ajaxDelete();

                    $(this).closest('span').remove();
                })
            });
        }
        ,initSelect2ByUser:function () {
            var that = this;
            //处理默认选中值
            var handlerArr = [];
            if(that._dataInfo && that._dataInfo.approvalOpinion.handler){
                var handlerName = that._dataInfo.approvalOpinion.handlerNames.split(',');
                var handler = that._dataInfo.approvalOpinion.handler.split(',');
                $.each(handler,function (i,item) {
                    handlerArr.push({id:item,text:handlerName[i]});
                });
            }
            $(that.element).find('select[name="handler"]').m_select2_by_search({
                type:2,
                option:{
                    multiple:true,
                    url:restApi.url_getProjectPartMember,
                    params:{projectId:that.settings.query.id},
                    value:handlerArr
                }},true);

        }
        //hover事件
        ,editTaskHoverFun:function () {
            var that = this;
            //文本移上去出现编辑图标hover事件
            $(that.element).find('a[data-action][data-deal-type="edit"],a[data-action="xeditable"]').each(function () {

                var $this = $(this);
                $this.parent().hover(function () {
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
        //在位编辑内容初始化
        ,bindEditable:function(){
            var that = this;
            $(that.element).find('a[data-action="xeditable"]').each(function () {
                var $this = $(this);
                var key = $this.attr('data-key');
                var value = $this.attr('data-value');
                var dataInfo = null;
                var noInternalInit = false;

                var popoverStyle={};
               if(key=='auditDesc'){

                    popoverStyle = {'width':'100%','max-width':'100%','z-index': 'inherit'};
                    value = $this.closest('.form-group').find('.show-span').html();

                }else{
                    popoverStyle = {'max-width':'140px','top':'-7px'};
                }


                $this.m_editable({
                    inline:true,
                    popoverStyle:popoverStyle,
                    hideElement:true,
                    isNotSet:false,
                    value:value,
                    dataInfo:dataInfo,
                    closed:function (data) {
                        if(data!=false){
                            var param = {};
                            if(data[key]!=null){
                                param[key] = data[key];
                                that.saveApprovalOpinion(param);
                            }
                        }
                        $(that.element).find('.show-span').show();
                    },
                    noInternalInit:noInternalInit,
                    completed:function ($popover) {
                        $(that.element).find('.show-span').show();
                        $this.parent().find('.show-span').hide();
                        if(key=='auditDesc'){
                            $this.closest('.form-group').find('.show-span').hide();
                        }
                    }
                },true);
            });
        }
        //保存校审意见
        ,saveApprovalOpinion:function (data) {
            var options={},that=this;
            options.url=restApi.url_saveApprovalOpinion;
            options.postData = data;
            options.postData.id = that.settings.query.auditId;

            m_ajax.postJson(options,function (response) {

                if(response.code=='0'){
                    S_toastr.success('操作成功！');
                    that.init();
                }else {
                    S_layer.error(response.info);
                }
            })
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
