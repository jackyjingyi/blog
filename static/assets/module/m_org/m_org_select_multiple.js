/**
 * 选择组织-多选(checkbox)
 * Created by wrb on 2018/12/3.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_org_select_multiple",
        defaults = {
            type:1,//1=弹窗，2=浮窗
            treeUrl: null,
            selectIds:null,
            postParam:null,//请求参数
            treeData:null,
            tipsStr:null,
            selectCallBack:null,//选择回调
            disabledRoot:false,
            disabledAll:false,//是否全disabled
            threeState:false,//父子级不关联选中
            okCallBack:null,
            renderCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;
        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentCompanyId = window.currentCompanyId;
        this._selectedOrgList = null;//当前选中的组织
        this._selectedOrgIdsList = [];//当前选中的组织
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;

            that.renderDialog();
        }
        //任务签发弹窗
        , renderDialog: function () {
            var that = this;
            var html = template('m_org/m_org_select_multiple', {tipsStr:that.settings.tipsStr});
            if(that.settings.type==1){
                S_layer.dialog({
                    title: that.settings.title || '选择组织',
                    area : '600px',
                    content:html,
                    cancel:function () {
                    },
                    ok:function () {

                        if(that.settings.okCallBack)
                            that.settings.okCallBack(that._selectedOrgIdsList,that._selectedOrgList);
                    }

                },function(layero,index,dialogEle){//加载html后触发
                    that.initTreeData(function (data) {
                        that.initTreeStructure(data, that.settings.ids);
                    });
                });
            }else{
                $(that.element).m_floating_popover({
                    content: html,
                    placement: 'bottomLeft',
                    popoverClass:'z-index-layer',
                    renderedCallBack: function ($popover)   {
                        that.initTreeData(function (data) {
                            that.initTreeStructure(data, that.settings.ids);
                        });
                    }
                }, true);
            }
        }
        //初始化树数据
        , initTreeData: function (callBack) {

            var that = this;
            if(that.settings.treeData){

                that._orgData = that.settings.treeData;
                return callBack(that.settings.treeData);

            }else{
                var option = {};
                option.url = that.settings.treeUrl? that.settings.treeUrl : restApi.url_getStaticCompanyForPaymentDetail;

                option.postData = {};

                if(that.settings.postParam)
                    option.postData = that.settings.postParam;

                m_ajax.postJson(option, function (response) {
                    if (response.code == '0') {
                        if (callBack != null) {
                            that._orgData = response.data;
                            return callBack(response.data);
                        }
                    } else {
                        S_layer.error(response.info);
                    }

                })
            }

        }
        //生成树结构
        , initTreeStructure: function (orgData, ids) {

            var that = this;

            var $tree = $('#organization_treeH');
            $tree.jstree({
                'core': {
                    'check_callback': true,
                    'data': orgData
                },
                'plugins': ['types', 'checkbox'],
                "checkbox": {
                    "keep_selected_style": false,
                    "cascade_to_disabled":false,
                    //"tie_selection": false,//checkbox与选中分开事件
                    //"whole_node":false,//checkbox与选中分开事件
                    "three_state": that.settings.threeState//父子级不关联选中
                },
                'types': {
                    'default': {
                        'icon': 'fa fa-users'
                    },
                    'independent': {   //独立经营图标
                        'icon': 'fa fa-trademark'
                    },
                    'partner': {       //合作伙伴图标

                        'icon': 'fa fa-share-alt'
                    },
                    'root': {         //根节点图标
                        'icon': 'fa fa-building'
                    }
                }
            }).bind('select_node.jstree', function (e, data) {

                console.log('select_node.jstree')

            }).bind('click.jstree', function (e) {

                var ref = $tree.jstree(true);//获得整个树
                var id = $(e.target).parents('li').attr('id');
                var node = ref.get_node("#"+id);
                var isPDisabled = ref.is_checked(node);
                if(node.children_d && !that.settings.disabledAll){
                    $.each(node.children_d,function (i,item) {
                        var itemNode = ref.get_node("#"+item);
                        var isDisabled = ref.is_disabled(itemNode);
                        if(!isDisabled && isPDisabled){
                            ref.check_node('#'+item);
                        }else{
                            ref.uncheck_node('#'+item);
                        }
                    })
                }
                //$('#organization_treeH').jstree(true).disable_node('#5339147901b34a0b99e16b6ac7054d64')
                /*$.each(data.node.children_d,function (i,item) {
                    var node = tree.get_node(item);
                    if(node.state.disabled==false)
                        childIdList.push(node.id);
                })*/
                var orgs = ref.get_selected(true);//获得所有选中节点，返回值为数组
                var ids = ref.get_selected(false);//获得所有选中节点，返回值为数组
                that._selectedOrgList = orgs;
                that._selectedOrgIdsList = ids;

                if(that.settings.selectedCallBack)
                    that.settings.selectedCallBack(that._selectedOrgIdsList,that._selectedOrgList);

            }).bind('ready.jstree', function (e, data) {//loaded.jstree

                var tree = $tree.jstree(true);
                tree.open_all();
                if(that.settings.selectIds!=null && that.settings.selectIds.length>0){
                    that._selectedOrgIdsList = that.settings.selectIds;
                    $.each(that.settings.selectIds,function (i,item) {
                        var node = tree.get_node(item);
                        tree.check_node(node);
                    });
                }
                if(that.settings.disabledRoot && that._orgData){
                    var ref = $tree.jstree(true);//获得整个树
                    ref.disable_node('#'+that._orgData.id);
                }
                //禁用所有
                if(that.settings.disabledAll===true){
                    $(that.element).find('li.jstree-node').each(function () {
                        var nodeId = $(this).attr('id');
                        tree.disable_node('#'+nodeId);
                    });
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
