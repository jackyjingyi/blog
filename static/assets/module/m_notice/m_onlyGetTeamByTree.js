/**
 * Created by veata on 2016/12/14.
 * It only applies in choosing Team or Organization from Tree(with checkBox).
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_onlyGetTeamByTree",
        defaults = {
            title: null,
            treeUrl: null,
            minHeight: null,
            width: null,
            currOrgTreeObj: null,
            parentOrgObj: null,
            isExcludeOrgChoice: null,//是否暂时隐藏树里面团队里的部门
            ids: '',
            callBack: null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._orgData = null;
        this._selectedOrgList = null;
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {

            this.initUserTreeDialog();
        }
        //任务签发弹窗
        , initUserTreeDialog: function () {
            var that = this;
            S_layer.dialog({
                title: that.settings.title || '选择组织',
                area : '600px',
                content:template('m_notice/m_onlyGetTeamByTree', {}),
                cancel:function () {
                },
                ok:function () {

                    var ids = '';
                    if(that._selectedOrgList && that._selectedOrgList.length>0){
                        $.each(that._selectedOrgList,function (i,item) {
                            ids += item.id+','
                        });
                        ids = ids.substring(0,ids.length-1);
                    }
                    var companyName = that.getCompanyName();
                    //console.log(ids);
                    if (ids && ids.length > 0) {
                        $(that.element).find('input[data-action="choseDepartment"]').val(companyName);
                    } else {
                        $(that.element).find('input[data-action="choseDepartment"]').val('点击设置');
                    }
                    return that.settings.callBack(ids);
                }

            },function(layero,index,dialogEle){//加载html后触发
                that.initTreeData(function (data) {
                    that.initTreeStructure(data, that.settings.ids);
                });
            });


        }
        //获取选中的组织名称
        , getCompanyName: function () {
            var that = this;
            var companyNameStr = '';
            if(that._selectedOrgList && that._selectedOrgList.length>0){
                $.each(that._selectedOrgList,function (i,item) {
                    if(item.original.type!='4'){
                        companyNameStr += item.text + ',';
                    }
                });
                if(companyNameStr.substring(companyNameStr.length-1,companyNameStr.length)==','){
                    companyNameStr = companyNameStr.substr(0,companyNameStr.length-1)
                }
            }
            return companyNameStr;
        }

        //初始化树数据
        , initTreeData: function (callBack) {

            var that = this;
            var option = {};
            option.url = that.settings.treeUrl != null && that.settings.treeUrl != '' ? that.settings.treeUrl : restApi.url_getOrgTreeForNotice;

            m_ajax.get(option, function (response) {
                if (response.code == '0') {
                    if (callBack != null) {
                        that._orgData = response.data;
                        /*if (that.settings.isExcludeOrgChoice != null) {
                            that.excludeOrgChoice(response.data);
                        }*/
                        return callBack(response.data);
                    }
                } else {
                    S_layer.error(response.info);
                }

            })
        }
        //是否排除团队里的部门选择（暂时去掉本部的子节点 以及分支机构与事业合伙人下的子节点分支机构与事业合伙人）
        , excludeOrgChoice: function (data) {
            $.each(data.children, function (i, child) {
                if (!(child.id.indexOf('partnerId') > -1 || child.id.indexOf('subCompanyId') > -1)) {
                    if (child.children && child.children.length > 0) {
                        child.children = [];
                    }
                } else {
                    if (child.children && child.children.length > 0) {
                        var childList1 = child.children;
                        for (var i = 0; i < childList1.length; i++) {
                            if (childList1[i].children && childList1[i].children.length > 0) {
                                childList1[i].children = [];
                            }
                        }
                    }
                }
            });
            return data;
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
                    "keep_selected_style": false
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
                //alert(data.node.original.realId);



            }).bind('click.jstree', function (event) {

                var ref = $tree.jstree(true);//获得整个树
                var orgs = ref.get_selected(true);//获得所有选中节点，返回值为数组
                that._selectedOrgList = orgs;
                //console.log(that._selectedOrgList)

            }).bind('ready.jstree', function (e, data) {//loaded.jstree

                var ref = $tree.jstree(true);//获得整个树
                ref.open_all();
                var ids = that.settings.ids;
                if (!isNullOrBlank(ids)) {//当初始化时有ids且不为空，即已选择发送范围时，勾上已选的checkbox

                    var orgList = ids.split(',');
                    $.each(orgList, function (j, childId) {
                        ref.select_node(childId);
                    })

                } else {//当 初始化时无ids或ids为空时，则默认勾上公司本部
                    var thisTeamId = window.currentCompanyId;//公司本部的Id
                    ref.select_node(thisTeamId);
                    that._selectedOrgList = ref.get_selected(true);
                }

            });
        }

    });

    $.fn[pluginName] = function (options) {
        return this.each(function () {

            //if (!$.data(this, "plugin_" + pluginName)) {
            $.data(this, "plugin_" +
                pluginName, new Plugin(this, options));
            //}
        });
    };

})(jQuery, window, document);
