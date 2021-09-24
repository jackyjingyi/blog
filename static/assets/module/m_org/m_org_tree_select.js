/**
 * 选择组织
 * Created by wrb on 2018/6/28.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_org_tree_select",
        defaults = {
            renderType:0,//默认0=浮窗展示,1=界面展示
            isCheck:false,//是否checkbox
            isRootDisabled:false,//是否根节点禁用
            param:null,
            treeData:null,
            selectedCallBack:null,//选中回滚事件
            renderCallBack:null,//渲染完成事件
            selectedId:null,//选中某节点
            selectedIds:null,//选中节点集合
            buttonStyle:null,//组件button样式
            spanStyle:null,//组件button>span样式
            treeBoxClass:'min-w-300 max-h-300 o-auto',
            clearOnInit:null,
            isBtnFullWidth:false
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;
        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._selectedData = null;//当前选中
        this._treeData = null;
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;

            that.getTreeData(function () {
                var html = template('m_org/m_org_tree_select', {renderType:that.settings.renderType,treeBoxClass:that.settings.treeBoxClass});
                //$(that.element).html(html);

                if(that.settings.renderType==0){
                    $(that.element).m_floating_popover({
                        content: html,
                        placement: 'bottomLeft',
                        popoverStyle:{'z-index':'19891050','max-width':'500px','min-width': '200px','min-height': '100px'},
                        clearOnInit:that.settings.clearOnInit,
                        renderedCallBack: function ($popover) {
                            that.$popoverEle = $popover;
                            that.renderOrgSelect($popover);
                        }
                    }, true);
                }else{

                    $(that.element).html(html);
                    that.renderOrgSelect($(that.element));
                }

            });

        }
        ,getTreeData:function (callBack) {
            var that = this;
            if(that.settings.treeData!=null){
                that._treeData = that.settings.treeData;
                if(callBack)
                    callBack();
            }else{
                var options={};
                options.url= restApi.url_getOrgTreeSimple;
                m_ajax.get(options,function (response) {
                    if(response.code=='0'){

                        that._treeData = response.data;
                        if(callBack)
                            callBack();

                    }else {
                        S_layer.error(response.msg);
                    }
                })
            }
        }
        , renderOrgSelect:function ($popover) {
            var that = this;
            var $tree = $popover.find('#orgTreeH');

            var plugins = ['types'];
            if(that.settings.isCheck)
                plugins = ['types', 'checkbox'];

            var jstree = $tree.jstree({
                'core': {
                    'check_callback': true,
                    'data':  that._treeData
                },
                'plugins': plugins,//['types', 'checkbox']
                "checkbox": {
                    "keep_selected_style": false
                },
                'types': {
                    'default': {
                        'icon': 'fa fa-folder'
                    }
                }
            }).on('after_open.jstree', function (e, data) {//load_node.jstree
                var tree = $tree.jstree(true);
                //禁用根节点选择
                if(that.settings.isRootDisabled==true)
                    tree.disable_node('#root');

            }).on('open_node.jstree', function (e, data) {//open_node.jstree

            }).on('close_node.jstree', function (e, data) {//close_node.jstree

            });


            if(that.settings.isCheck){
                jstree.bind('click.jstree', function (event) {

                    var ref = $tree.jstree(true);//获得整个树
                    var orgs = ref.get_selected(true);//获得所有选中节点，返回值为数组
                    var ids = ref.get_selected(false);//获得所有选中节点，返回值为数组
                    that._selectedOrgList = orgs;
                    that._selectedOrgIdsList = ids;

                    if(that.settings.selectedCallBack)
                        that.settings.selectedCallBack(that._selectedOrgList);

                }).on('ready.jstree', function (e, data) {//loaded.jstree

                    var tree = $tree.jstree(true);
                    tree.open_all();
                    tree.deselect_all();

                    if(that.settings.selectedId!=null){
                        var node = tree.get_node(that.settings.selectedId);
                        tree.check_node(node);
                    }else if(that.settings.selectedIds){
                        $.each(that.settings.selectedIds,function (i,item) {
                            tree.select_node(item);
                        })
                    }


                    if(that.settings.renderCallBack)
                        that.settings.renderCallBack();

                    //阻止浮窗关闭
                    $popover.find('#orgTreeH').on('click',function (e) {
                        e.stopPropagation();
                    });

                })

            }else{
                jstree.on('select_node.jstree', function (e, data) {

                    var tree = $tree.jstree(true);
                    that._selectedData = data.node.original;//获取当前树的对象
                    if(that.settings.selectedCallBack)
                        that.settings.selectedCallBack(that._selectedData);

                    $(that.element).m_floating_popover('closePopover');//关闭浮窗

                }).on('ready.jstree', function (e, data) {//loaded.jstree

                    var tree = $tree.jstree(true);
                    tree.open_all();
                    tree.deselect_all();

                    if(that.settings.selectedId){

                        tree.select_node(that.settings.selectedId);

                    }else{//默认选择根节点

                        var inst = data.instance;
                    }

                    if(that.settings.renderCallBack)
                        that.settings.renderCallBack();

                    /*//阻止浮窗关闭
                    $popover.find('#orgTreeH').on('click',function (e) {
                        e.stopPropagation();
                    });*/

                })
            }


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
