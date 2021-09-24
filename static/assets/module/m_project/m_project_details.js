/**
 * 项目信息－项目详情
 * Created by wrb on 2019/1/28.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_project_details",
        defaults = {
            projectId:null,
            projectName:null,
            createCompanyId:null,//立项组织
            editFlag:null,
            dataCompanyId:null//视图ID
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
        this._breadcrumb = [
            {
                name: this.settings.businessType==1?'我的项目':'我的课题'
            },
            {
                name:this.settings.projectName,
                url:'#/project/basicInfo?id='+this.settings.projectId+'&projectName='+encodeURI(this.settings.projectName)+'&dataCompanyId='+this.settings.dataCompanyId+ '&businessType=' + this.settings.businessType
            },
            {
                name:'项目详情'
            }
        ];

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function (t) {
            var that = this;
            that.getData(function () {
                that.renderContent(t);
                that.renderChangeHistory();
                that.editTaskHoverFun();
                that.bindEditable();
                that._leftBoxHeightResize = new leftBoxHeightResize($(that.element).find('#leftBox'),$(that.element).find('#leftBox'),$(that.element).find('#rightBox'),106);
                that._leftBoxHeightResize.init();
            });
        },
        //渲染初始界面
        getData:function (callBack) {
            var that = this;
            var options={};
            options.classId = '#content-right';
            options.url=restApi.url_getProjectDetail;
            options.postData = {
                projectId:that.settings.projectId
            };
            m_ajax.postJson(options,function (response) {

                if(response.code=='0'){
                    that._dataInfo = response.data;
                    if(callBack)
                        callBack();
                }else {
                    S_layer.error(response.info);
                }
            });
        }
        ,renderContent:function (t) {
            var that = this;
            var html = template('m_project/m_project_details',{
                dataInfo:that._dataInfo,
                projectId : that.settings.projectId,
                projectName : that.settings.projectName,
                projectNameCode : encodeURI(that.settings.projectName),
                editFlag:that.settings.editFlag,
                dataCompanyId:that.settings.dataCompanyId,
                currentCompanyId : that._currentCompanyId,
                currentCompanyUserId:that._currentCompanyUserId,
                createCompanyId:that.settings.createCompanyId
            });

            $(that.element).html(html);

            if($(that.element).find('#breadcrumb').length>0)
                $(that.element).find('#breadcrumb').m_breadcrumb({dataList:that._breadcrumb},true);

            that.bindActionClick();

            if(t!=null)
                $(that.element).find('.tabs-container a[href="#tab-'+t+'"]').click();
        }

        ,bindActionClick:function ($ele) {
            var that = this;
            if($ele==null)
                $ele = $(that.element);
            $ele.find('a[data-action],button[data-action]').on('click',function () {
                var $this = $(this),dataAction = $this.attr('data-action');
                var dataId = $this.closest('tr').attr('data-id');
                var dataI = $this.closest('tr').attr('data-i')-0;
                switch (dataAction){

                    case 'submitComment'://添加评论

                        var option={};
                        option.classId = '#content-right';
                        option.url=restApi.url_commentProjectTask;
                        option.postData = {
                            taskId:that.settings.projectId,
                            comment:$(that.element).find('form#commentForm textarea[name="comment"]').val()
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
                    case 'uploadFile':

                        $('body').m_docmgr_fileUpload({
                            doType:2,
                            param : {folderId:that._dataInfo.filePid},
                            fileList:that._dataInfo.attachList,
                            cancelCallBack:function () {
                                that.init(3);
                            }
                        });
                        break;
                    case 'returnBack'://返回

                        $('.m-metismenu ul.metismenu li.active a span').click();


                }
            });

            $(that.element).find('a[data-toggle="tab"]').on('click',function () {
                that._leftBoxHeightResize.setHeight();
            });

        }
        //渲染变更记录
        ,renderChangeHistory:function () {
            var that = this;
            var option = {};
            option.param = {};
            option.param.historyId = that.settings.projectId;
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

                    //任务订单-查看描述
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
        ,editTaskHoverFun:function () {
            var that = this;
            //文本移上去出现编辑图标hover事件
            $(that.element).find('a[data-action="xeditable"]').each(function () {

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
                if(key=='projectRemark'){
                    popoverStyle = {'width':'100%','max-width':'100%'};
                    value = $this.closest('.form-group').find('.show-span').html();
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
                                that.saveProjectData(param);
                            }
                        }
                        $(that.element).find('.show-span').show();
                    },
                    noInternalInit:noInternalInit,
                    completed:function ($popover) {
                        $(that.element).find('.show-span').show();
                        $this.parent().find('.show-span').hide();
                        if(key=='projectRemark'){
                            $this.closest('.form-group').find('.show-span').hide();
                        }
                    }
                },true);
            });
        }
        //保存基本信息
        ,saveProjectData: function (param) {
            var that = this;
            var options = {};
            options.url = restApi.url_project;
            options.classId = '#content-right';
            options.postData = {};
            options.postData.id = that.settings.projectId;
            $.extend(options.postData, param);
            m_ajax.postJson(options, function (response) {
                if (response.code == '0') {

                    S_toastr.success('保存成功！');
                    that.init();

                } else {
                    S_layer.error(response.info);
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
