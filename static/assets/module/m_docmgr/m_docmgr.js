;(function ($, window, document, undefined) {

    "use strict";

    var pluginName = "m_docmgr",
        defaults = {
            projectId: '',
            projectName:null,
            dataCompanyId:null//视图组织ID
        };

    function Plugin(element, options) {
        this.element = element;
        this.settings = options;
        this._defaults = defaults;
        this._name = pluginName;
        this._selectedNodeObj = null;//当前选中节点对象
        this._fileItems = [];
        this._uploadmgrContainer = null;
        this._btnNewDir = null;
        this._btnUpload = null;
        this._fileListItemsContainer = null;
        this._breadcrumbContainer = null;
        this._breadcrumb = {
            allowOperate: false,
            curDirId: null,
            lastDirId: null,
            items: [{dirId: null, text: '根目录'}]
        };

        this._companyId = currentCompanyId;
        if (_.isBlank(this._companyId)) {
            S_layer.error('无法获取团队Id');
            return;
        }

        this._projectId = this.settings.projectId;
        if (_.isBlank(this._projectId)) {
            S_layer.error('无法获取项目Id');
            return;
        }

        this._breadcrumb = [
            {
                name:'我的项目'
            },
            {
                name:this.settings.projectName,
                url:'#/project/basicInfo?id='+this.settings.projectId+'&projectName='+encodeURI(this.settings.projectName)+'&dataCompanyId='+this.settings.dataCompanyId
            },
            {
                name:'项目文档'
            }
        ];

        this.init();
    }

    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.renderHtml();
        }
        //渲染基础页
        ,renderHtml: function () {
            var that = this;

            var html = template('m_docmgr/m_docmgr', {
                projectName:that.settings.projectName
            });
            $(that.element).html(html);
            $(that.element).find('#breadcrumb').m_breadcrumb({dataList:that._breadcrumb},true);
            that.initDocmgrTree();

        }
        //初始化组织树
        , initDocmgrTree: function () {
            var that = this;
            var $tree = $('#documentDirectoryTree');
            $tree.jstree({
                'core': {
                    'check_callback': true,
                    'data':function (node, callback) {
                        var option = {};
                        option.async = false;
                        option.postData = {};
                        var jsonStr='[]';
                        var jsonArray = eval('('+jsonStr+')');
                        if(node.id === '#'){
                            option.url = restApi.url_getMyProjectsDocuments;
                            option.postData.id = that._projectId;
                            m_ajax.postJson(option, function (response) {
                                if (response.code == '0') {
                                    var arrays= response.data.data;
                                    var arr = {
                                        'id':arrays.id,
                                        'children':response.data.childId,
                                        'text':arrays.projectName,
                                        'pid':null,
                                        'taskId':response.data.taskId,
                                        'type':response.data.type,
                                        'haveNoticeRight':response.data.haveNoticeRight,
                                        'uploadFlag':response.data.uploadFlag,
                                        'classicFlag':response.data.classicFlag
                                    };
                                    jsonArray.push(arr);
                                } else {
                                    S_layer.error(response.msg?response.msg:response.info);
                                }
                            });
                        }else{
                            option.url = restApi.url_getSkyDriverByProject;
                            if(node.original.projectId!=null){//存在此字段
                                option.postData.projectId = node.original.projectId;
                                option.postData.pid = node.id;
                            }else{
                                option.postData.projectId = node.id;
                            }
                            option.postData.type = that._selectedNodeObj.type;

                            m_ajax.postJson(option, function (response) {
                                if (response.code == '0') {
                                    var arrays= response.data.list;
                                    if(arrays!=null && arrays.length>0){
                                        for(var i=0 ; i<arrays.length; i++){
                                            var arr = {
                                                'id':arrays[i].id,
                                                'pid':node.id,
                                                'children':arrays[i].childId,
                                                'text':arrays[i].fileName,
                                                'projectId':arrays[i].projectId,
                                                'taskId':arrays[i].taskId,
                                                'type':arrays[i].type,
                                                'haveNoticeRight':arrays[i].haveNoticeRight,
                                                'uploadFlag':response.data.uploadFlag,
                                                'classicFlag':response.data.classicFlag
                                            };
                                            jsonArray.push(arr);
                                        }
                                    }
                                } else {
                                    S_layer.error(response.msg?response.msg:response.info);
                                }
                            });
                        }
                        callback.call(this, jsonArray);
                    }
                },
                'plugins': ['noclose', 'types', 'wholerow'],
                'types': {
                    'default': {
                        'icon': 'fa fa-folder'
                    },
                    '1': {   //文件
                        'icon': 'fa fa-file'
                    },
                    '50': {   //归档文件
                        'icon': 'fa fa-steam-square'
                    }
                }
            }).on('select_node.jstree', function (e, data) {

                that._selectedNodeObj = data.node.original;
                that.getFileItemsList();

            }).on('ready.jstree', function (e, data) {//loaded.jstree

                var tree = $('#documentDirectoryTree').jstree(true);
                var firstId = $(that.element).find('#documentDirectoryTree li:first').attr('id');
                tree.select_node('#'+firstId);
                that.bindActionClick();

            }).on('load_node.jstree', function (e, data) {//load_node.jstree

            });
        }
        //获取文件列表
        , getFileItemsList:function () {
            var that = this;
            var projectId = that._selectedNodeObj.pid==null?that._selectedNodeObj.id:that._selectedNodeObj.projectId;
            var pid = that._selectedNodeObj.id;
            var options = {};

            options.projectId = projectId;
            options.dataCompanyId = that.settings.dataCompanyId;
            if(projectId!=pid){//不是根目录
                options.pid = pid;
            }
            options.selectedNodeObj = that._selectedNodeObj;
            options.requestCallBack = function (data) {
                that.hideBtnAction(data);
                that.initContextMenu(data.uploadFlag);
            };
            options.refreshDataCallBack = function () {
                that.getFileItemsList();
                var tree = $('#documentDirectoryTree').jstree(true),
                    sel = tree.get_selected();
                tree.refresh_node('#'+sel);
            };
            options.renderCallBack = function () {

                new leftBoxHeightResize($(that.element).find('#documentTreeBox'),$(that.element).find('#documentTreeBox'),$(that.element).find('#fileItems'),50).init();
            };
            $(that.element).find('#fileItems').m_docmgr_fileItems_list(options,true);
        }
        //初始化右键菜单
        ,initContextMenu:function (flag) {
            var that = this;
            if($('.contextMenuBox.outContentMenu').length>0)
                $('.contextMenuBox.outContentMenu').remove();

            var items = [];
            if(flag==1){
                items.push({
                    content: "上传文件",
                    action: function (e, item) {
                        that.uploadFile();
                    }
                });
                items.push({
                    content: "新建文件夹",
                    action: function (e, item) {
                        that.createFolder();
                    }
                });
            }
            if(that._selectedNodeObj.taskId!=null && that._selectedNodeObj.type==40){
                items.push({
                    content: "发送归档通知",
                    action: function (e, item) {
                        that.sendArchiveNotice();
                    }
                });
            }
            if(items.length>0){
                var menu = new contextMenu({
                    target: document.getElementById('fileItems'),//开启自定义右键菜单的目标,
                    hasIcon: false,//是否需要图标
                    hasTitle: false,//是否需要标题
                    autoHide:false,//是否自动隐藏右键菜单
                    menuClass:'outContentMenu',
                    menu: {//菜单数据配置
                        items: items
                    },
                    beforeShow:function () {
                        $('.contextMenuBox').hide();
                    },
                    afterShow:function () {
                    }
                });
            }
        }
        //隐藏按钮
        ,hideBtnAction:function (data) {
            var that = this;
            if(data.uploadFlag==0){
                $(that.element).find('a.btn-flag').hide();
            }else{
                $(that.element).find('a.btn-flag').show();
            }
            if(data.classicFlag==1){
                $(that.element).find('a[data-action="sendArchiveNotice"]').show();
            }else{
                $(that.element).find('a[data-action="sendArchiveNotice"]').hide();
            }
        }
        //创建文件夹
        ,createFolder:function () {
            var that = this,options = {};
            options.selectedNodeObj = that._selectedNodeObj;
            options.saveCallBack = function () {
                that.getFileItemsList();
                var tree = $('#documentDirectoryTree').jstree(true),
                    sel = tree.get_selected();
                tree.refresh_node('#'+sel);
            };
            $('body').m_docmgr_createFolder(options);
        }
        //上传文件
        ,uploadFile:function () {
            var that = this,options = {};
            options.selectedNodeObj = that._selectedNodeObj;
            options.saveCallBack = function () {
                that.getFileItemsList();
            };
            $('body').m_docmgr_fileUpload(options);
        }
        //发送归档通知
        ,sendArchiveNotice:function () {
            var that = this,options = {};
            options.selectedNodeObj = that._selectedNodeObj;
            options.saveCallBack = function () {
                that.getFileItemsList();
                var tree = $('#documentDirectoryTree').jstree(true),
                    sel = tree.get_selected();
                tree.refresh_node('#'+sel);
            };
            $('body').m_docmgr_sendArchiveNotice(options);
        }
        //绑定事件
        , bindActionClick:function () {
            var that = this;
            $(that.element).find('a[data-action]').off('click').on('click',function () {
                var $this = $(this);
                var dataAction = $this.attr('data-action');
                switch (dataAction){
                    case 'createFolder'://创建文件夹
                        that.createFolder();
                        break;
                    case 'uploadFile':
                        that.uploadFile();
                        break;
                    case 'sendArchiveNotice'://发送归档通知
                        that.sendArchiveNotice();
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
