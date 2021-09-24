/**
 * 选择组织
 * Created by wrb on 2018/6/28.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_task_issue_nav",
        defaults = {
            treeUrl:null,
            renderType:0,//默认0=浮窗展示,1=界面展示
            param:null,
            bemodifyId:null,
            taskType:null,//详情是生产=0、订单=2、子项=1
            projectName:null,
            dataCompanyId:null,//视图ID
            selectedCallBack:null,//选中回滚事件
            renderCallBack:null,//渲染完成事件
            selectedId:null,//选中某节点
            buttonStyle:null,//组件button样式
            spanStyle:null//组件button>span样式
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;
        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentCompanyId = window.currentCompanyId;
        this._selectedOrg = null;//当前选中的组织
        this._extendData = null;//请求返回的数据(extendData)
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;

            var option = {};
            option.url = that.settings.treeUrl?that.settings.treeUrl:restApi.url_getProjectIssueTree;
            if(that.settings.param)
                option.postData = that.settings.param;

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    that._taskList = response.data;
                    var html = template('m_task_issue/m_task_issue_nav',{
                        taskList:response.data,
                        buttonStyle:that.settings.buttonStyle,
                        spanStyle:that.settings.spanStyle,
                        renderType:that.settings.renderType
                    });
                    $(that.element).html(html);

                    that.renderTaskNavSelect(response.data);

                } else {
                    S_layer.error(response.info);
                }
            });

        }
        , renderTaskNavSelect:function (data) {
            var that = this;
            var $tree = $(that.element).find('#orgTreeH');
            $tree.jstree({
                'core': {
                    'check_callback': true,
                    'data': data
                },
                'plugins': ['types'],
                'types': that.settings.treeIconObj || {
                    'default': {
                        'icon': 'fa fa-folder'
                    },
                    'independent': {   //独立经营图标
                        'icon': 'fa fa-users'
                    },
                    'partner': {       //事业合伙人图标
                        'icon': 'iconfont rounded icon-cooperation'
                    },
                    'partnerContainer': {       //事业合伙人容器图标
                        'icon': 'iconfont rounded icon-cooperation'
                    },
                    'subCompany': {       //分支机构图标
                        'icon': 'iconfont rounded icon-2fengongsi1'
                    },
                    'subCompanyContainer': {       //分支机构容器图标
                        'icon': 'iconfont rounded icon-2fengongsi1'
                    },
                    'company': {         //根节点图标
                        'icon': 'iconfont rounded icon-2fengongsi'
                    },
                    'root': {         //根节点图标
                        'icon': 'iconfont rounded icon-2fengongsi'
                    }
                }
            }).on('select_node.jstree', function (e, data) {

                if(data.node && that.settings.selectedCallBack)
                    that.settings.selectedCallBack(data.node.original,data.parent);

            }).on('ready.jstree', function (e, data) {//loaded.jstree

                var tree = $tree.jstree(true);
                tree.open_all();

                $tree.jstree('select_node', that.settings.selectedId , true );

                if(that.settings.renderCallBack)
                    that.settings.renderCallBack();


            }).on('after_open.jstree', function (e, data) {//load_node.jstree

                var tree = $tree.jstree(true);
                //禁用根节点选择
                //tree.disable_node('#root');

            }).on('open_node.jstree', function (e, data) {//open_node.jstree

            }).on('close_node.jstree', function (e, data) {//close_node.jstree

            }).on('changed.jstree', function (e, data) {//close_node.jstree



            });
        }
        //判断是否出现按钮
        ,renderTaskButton:function () {
            var that = this;

            var tree = $(that.element).find('#orgTreeH').jstree(true);

            if(that.settings.selectedId){
                that._selectedOrg = tree.get_node(that.settings.selectedId);
                tree.select_node(that.settings.selectedId,true);
            }
            if(!that._selectedOrg){
                that._selectedOrg = tree.get_selected();//data.node.original;//获取当前树的对象
                that._selectedOrg = tree.get_node(that._selectedOrg);
            }
            if(!that._selectedOrg)
                return false;

            $(that.element).find('.task-name').html(that._selectedOrg.text);

            /*if(that._selectedOrg && that._selectedOrg.original.isOperaterTask==1 && that._selectedOrg.original.isOnOff==1){

                var title = '点击进入生产模式',icon='icon iconfont icon-kaiguanguan',url= '#/project/production/details?id='+that.settings.param.projectId+'&projectName='+encodeURI(that.settings.projectName)+'&taskId='+that._selectedOrg.original.id+'&dataCompanyId='+that.settings.dataCompanyId;

                if(that.settings.taskType==0){
                    title = '点击进入订单模式';
                    icon='icon iconfont icon-kaiguanguan1';
                    url= '#/project/taskIssue/details?id='+that.settings.param.projectId+'&projectName='+encodeURI(that.settings.projectName)+'&taskId='+that._selectedOrg.original.id+'&dataCompanyId='+that.settings.dataCompanyId;
                }
                var toolTip='<span class="tree-btn" >&nbsp;<a href="'+url+'" data-toggle="tooltip" data-placement="top" title="'+title+'"><i class="f-s-m '+icon+'"></i></a></span>';
                $('#orgTreeH .jstree-clicked').after(toolTip);
                $('#orgTreeH .jstree-clicked').parent().find('span.tree-btn a').tooltip();
            }*/
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
