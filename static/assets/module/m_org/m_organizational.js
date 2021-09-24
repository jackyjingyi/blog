/**
 * 组织－组织架构
 * Created by wrb on 2017/2/23.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_organizational",
        defaults = {};

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;
        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._companyVersion = window.companyVersion;
        this._currentCompanyId = window.currentCompanyId;
        this._currTreeObj = null;//当前节点
        this._rootTreeObj = null;//根节点
        this._selectedCompanyId = null;
        this._treeType = 1;//1=当前组织，0=总部
        this._roleCode = null;
        this._orgUserList = [];//当前节点组织人员
        this._leftBoxHeightResize = null;//左边div高度自适应设定初始对象

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that._roleCode = window.currentRoleCodes;
            var html = template('m_org/m_organizational', {
                companyVersion:that._companyVersion
            });
            $(that.element).html(html);
            rolesControl();
            that.initOrgTree();
            that.bindTreeSwitch();
            that.bindActionClick();

            that._leftBoxHeightResize = new leftBoxHeightResize($(that.element).find('#org-tree-box'),$(that.element).find('#organization_treeH'),$(that.element).find('#orgUserListBox'),96);
            that._leftBoxHeightResize.init();

            rolesControl();
        }
        //初始化人员列表
        , initOrgUserList: function (orgId) {
            var that = this;
            var hasHr_employee = that._roleCode.indexOf('10000301')>-1;
            $(this.element).find('#orgUserListBox').m_orgUserList({
                orgId:orgId,
                currOrgTreeObj:that._currTreeObj,
                isEdit:hasHr_employee && that._treeType===1,
                trClickCallBack:function () {
                    that._leftBoxHeightResize.setHeight();
                },
                renderCallBack:function (data) {
                    that._orgUserList = data;
                }
            });
        }
        //初始化组织树
        , initOrgTree: function () {//type==1为显示完整组织树并可操作，type！=1为只显示本组织下的树
            var that = this;
            var options = {},type=that._treeType;
            options.isDialog = false;
            options.isGetUserList = false;
            options.treeUrl = type!=1?restApi.url_getOrgStructureTree:restApi.url_getOrgTreeSimple;
            options.currentCompanyId = window.currentCompanyId;
            options.plugins = ['types','dnd'];
            options.treeIconObj = {
                'default': {
                    'icon': 'iconfont rounded icon-zuzhijiagou'
                },
                'independent': {   //独立经营图标
                    'icon': 'fa fa-users'
                },
                'depart': {
                    'icon': 'iconfont rounded icon-zuzhijiagou'
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

            };
            options.renderTreeCallBack = function (data) {
                that._rootTreeObj = data;
            };
            options.initTreeDataCallBack = function(info){//用于判断info,如果Info为“0”表示不需要显示切换组织树，为“1”表示需要显示
                if(that._treeType ==1 && info && info!=1){
                    $('.treeSwitch a[data-action="treeSwitch"]').remove();
                }
            };
            options.afterOpenCallBack = function (data) {

                if(that._treeType !==1){
                    var html = '<i class="fa fa-flag fc-dark-blue m-l-xs m-r-xs" role="presentation"></i>';
                    var id = that._selectedCompanyId;
                    if(id && !($('#organization_treeH li#'+id+'>a#'+id+'_anchor').find('i.fa-flag').length>0)){
                        $('#organization_treeH li#'+id+'>a#'+id+'_anchor').find('.icon-2fengongsi1').remove().end().prepend(html);
                    }
                }
                that.dealTreeIconColorFun(data.node.id);
            };
            options.selectNodeCallBack = function (data,type) {
                that._currTreeObj = data;
                // console.log(data);
                that.initOrgUserList(data.realId);
                $('#organization_treeH .tree-btn').remove();
                $('#organization_treeH .tooltip').remove();
                $(that.element).find('#departName').html(data.text);
                if(that._currTreeObj.treeEntity.departType=='2'){
                    $(that.element).find('button[data-action="editDepartIntroduction"]').show();
                }else{
                    $(that.element).find('button[data-action="editDepartIntroduction"]').hide();
                }


                if(that._treeType!=1){
                    $(that.element).find('.headContent').hide();
                    //给我的组织加上图标标识
                    if(type &&　type == 'ready'){
                        var html = '<i class="fa fa-flag fc-dark-blue m-l-xs m-r-xs" role="presentation"></i>';
                        var id = data.id;
                        that._selectedCompanyId = id;
                        if(id && !($('#organization_treeH li#'+id+'>a#'+id+'_anchor').find('i.fa-flag').length>0)) {
                            $('#organization_treeH li#' + id + '>a#' + id + '_anchor').find('.icon-2fengongsi1').remove().end().prepend(html);
                        }
                    }
                    return;
                }else{
                    $(that.element).find('.headContent').show();
                }

                //先给所有操作按钮去除禁用状态，以及绑定点击事件
                $(that.element).find('.headContent a[data-action]').removeAttr('disabled');
                $(that.element).find('.headContent a[data-action="drop_down"]').attr('data-toggle','dropdown');
                that.bindActionClick();
                that.addTreeBtn(data);

                if(data.type=='4'){
                    $(that.element).find('.headContent a[data-action="addUser"]').attr('disabled','disabled').off('click');
                    $(that.element).find('.headContent a[data-action="bulkImport"]').attr('disabled','disabled').off('click');
                }
                if(data.id=='root'){
                    $(that.element).find('.headContent a[data-action="addUser"]').attr('disabled','disabled').off('click');
                    $(that.element).find('.headContent a[data-action="bulkImport"]').attr('disabled','disabled').off('click');
                    $(that.element).find('.headContent a[data-action="addDepart"]').attr('disabled','disabled').off('click');
                }

                rolesControl();
                that._leftBoxHeightResize.setHeight();
            };
            $(that.element).find('#organization_treeH').m_orgByTree(options);
        }
        //树icon颜色处理
        , dealTreeIconColorFun:function (id) {

            var tree = $('#organization_treeH').jstree(true), sel = tree.get_node(id);
            if(sel && sel.children){
                $.each(sel.children,function (i,item) {

                    var selData = tree.get_node(item);
                    var $li = $('#organization_treeH').find('li#'+item);
                    if(selData.original.orgStatus=='1'){//离职状态
                        $li.css('color','#999').attr('title','已离职');
                    }
                    if(selData.original.relationType==1){
                        $li.find('a.jstree-anchor i.jstree-icon').addClass('color-blue');
                    }else if(selData.original.relationType==2){
                        $li.find('a.jstree-anchor i.jstree-icon').addClass('color-green');
                    }else if(selData.original.relationType==3){
                        $li.find('a.jstree-anchor i.jstree-icon').addClass('fc-red');
                    }

                });
            }

        }
        //节点添加编辑按钮
        ,addTreeBtn:function (data) {
            var that = this;
            if( data.id!=window.currentCompanyId && data.id!='root'){
                if(that._roleCode.indexOf('10000301')>-1){
                    $('#organization_treeH .jstree-clicked').after('<span class="tree-btn" >&nbsp;<a data-action="deleteDepart" data-toggle="tooltip" data-placement="top" title="删除"><i class="fa fa-times"></i></a></span>' +
                        '<span class="tree-btn" >&nbsp;<a data-action="editDepart" data-toggle="tooltip" data-placement="top" title="编辑"><i class="fa fa-pencil"></i></a></span>');

                    $('#organization_treeH .jstree-clicked').parent().find('span.tree-btn a').tooltip();
                    that.bindEditDepartment($('#organization_treeH .jstree-clicked').closest('li'));
                }
            }
        }
        //绑定转换组织架构树的按钮
        ,bindTreeSwitch:function(){
            var that = this;
            $(that.element).find('.treeSwitch a[data-action="treeSwitch"]').bind('click',function(e){
                var html = '';
                if(that._treeType===1){
                    html = '<img src="'+window.rootPath+'/img/my_org_framework.png" style="height: 23px;" data-toggle="tooltip" data-placement="top" title="查看我的组织架构" />';
                }else{
                    html = '<img src="'+window.rootPath+'/img/whole_org_framework.png" style="height: 23px;" data-toggle="tooltip" data-placement="top" title="查看总公司组织架构" />';
                }
                $(this).html(html);
                $(this).find('img').tooltip();
                that._treeType=that._treeType===1?0:1;
                var html = '<div class="clearfix margin-bottom-10"></div><div id="organization_treeH"><ul class="sidebar-nav list-group sidebar-nav-v1"></ul></div>';
                $(that.element).find('#organization_treeH').parent().html(html);
                that.initOrgTree(that._treeType);
                stopPropagation(e);
            });
            $(that.element).find('.treeSwitch a[data-action="treeSwitch"]>img').tooltip();
        }

        //右边界面文字刷新{所属部门...}
        , dealHtmlTextRefresh: function (data) {
            $('span[data-obj="currOrgObj"][data-key]').each(function () {
                var name = $(this).attr('data-key');
                if (data[name] != null) {
                    $(this).html(data[name]);
                }
            });
        }
        //给部门绑定编辑部门按钮
        ,bindEditDepartment:function($obj){
            var that = this;
            $obj.find('a[data-action="editDepart"]').on('click',function(event) {
                if(that._currTreeObj.type=='4'){//分组
                    $('body').m_org_type_edit({
                        title:'编辑部门分组',
                        dataInfo:that._currTreeObj,
                        saveCallBack : function (data) {
                            editNodeByTree(data);
                            that.addTreeBtn(that._currTreeObj);
                            that._currTreeObj.text = data.text;
                            that._currTreeObj.treeEntity = data.treeEntity;
                            that._currTreeObj.departManagerList = data.departManagerList;
                        }
                    });
                }else{//部门
                    //先请求后台数据，拿到封面信息之后再打开编辑部门弹框
                    that.getDepartData($obj,function (data) {
                        that.editDepart($obj,data);
                    })

                }

            });
            $obj.find('a[data-action="deleteDepart"]').on('click',function(event) {
                that.delDepart($obj);
            });
        }
        //人员数据并加载模板
        ,getDepartData:function ($obj,callBack) {

            var that = this;
            var option  = {};
            option.url = restApi.url_queryDepartById;
            option.postData = {};
            option.postData.id = that._currTreeObj.treeEntity.id;
            option.postData = $.extend({}, option.postData );

            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){
                    var resopnseData= response.data;

                    if(callBack){
                        callBack(resopnseData);
                    }
                }else {
                    S_layer.error(response.info);
                }

            })

        }
        //给批量导入按钮绑定事件
        ,bindBulkImport:function($obj){
            var that = this;
            $obj.find('a[data-action="bulkImport"]').on('click',function(event){
                that.bulkImport();
            });
        }
        ,editDepart: function ($obj,data) {
            var that = this;
            var options = {};
            options.doType = 'edit';
            options.title = '编辑部门';
            options.departObj = that._currTreeObj.treeEntity;
            options.departObj.departName = that._currTreeObj.text;
            options.departObj.parentDepart = that._currTreeObj.parentOrgObj.treeEntity;
            options.departObj.parentDepart.departName = that._currTreeObj.parentOrgObj.text;
            options.departObj.departType = data.departType;
            options.companyId = that._currTreeObj.companyId;
            options.realId = that._currTreeObj.realId;
            options.orgUserList = that._orgUserList;
            options.fileId = data.fileId;
            options.fileName = data.fileName;
            options.fileFullPath = data.fileFullPath;
            options.departList = data.departList;
            options.saveCallBack = function (data) {
                if(data.isChangePid){
                    that.init();
                }else{
                    editNodeByTree(data);
                    that.addTreeBtn(that._currTreeObj);
                    that._currTreeObj.text = data.text;
                    that._currTreeObj.treeEntity = data.treeEntity;
                    that._currTreeObj.departManagerList = data.departManagerList;
                    that.dealHtmlTextRefresh(data);
                }


            };
            $('body').m_editDepart(options);
        }
        //删除部门
        ,delDepart:function (e) {
            var that = this;
            S_layer.confirm('部门下包含的人员或子部门将一起删除，此操作不可恢复。确定要继续吗？',function(){
                var options = {};
                options.url = restApi.url_depart+'/'+ that._currTreeObj.id;
                m_ajax.get(options,function (response) {
                    if(response.code=='0'){
                        S_toastr.success('删除成功！');
                        delNodeByTree();
                    }else {
                        S_layer.error(response.info);
                    }
                })
            },function(){});
        }
        //删除分支机构事件
        ,deleteSubCompany:function($obj,data){
            var that = this;
            $obj.find('.tree-btn a[data-action="deleteSubCompany"]').on('click',function(event) {

                S_layer.confirm('确定要删除该分支机构吗？', function () {

                    var option = {};
                    option.url = restApi.url_subCompany + '/' + data.companyId;
                    m_ajax.get(option, function (response) {
                        if (response.code == '0') {
                            S_toastr.success('删除成功！');
                            var rel =  $('#organization_treeH').jstree(true);
                            delNodeByTree();
                            var subCompanyId = window.currentCompanyId+'subCompanyId_anchor';
                            that.dealTreeIconColorFun(window.currentCompanyId+'subCompanyId');
                            if($('#organization_treeH').find('a#'+subCompanyId).next('ul').length<1){
                                rel.delete_node(subCompanyId);
                            }
                            var id = $('#organization_treeH>ul>li>a:eq(0)').attr('id');
                            rel.select_node(id);
                        } else {
                            S_layer.error(response.info);
                        }
                    });

                }, function () {
                });
            });

        }
        //删除事业合伙人
        ,deletePartner:function($obj,data){
            var that = this;
            $obj.find('.tree-btn a[data-action="deletePartner"]').on('click',function(event) {

                S_layer.confirm('确定要删除该事业合伙人吗？', function () {

                    var option = {};
                    option.url = restApi.url_businessPartner + '/' + data.companyId;
                    m_ajax.get(option, function (response) {
                        if (response.code == '0') {
                            S_toastr.success('删除成功！');
                            delNodeByTree();
                            var rel =  $('#organization_treeH').jstree(true);
                            var partnerId = window.currentCompanyId+'partnerId_anchor';
                            that.dealTreeIconColorFun(window.currentCompanyId+'partnerId');
                            if($('#organization_treeH').find('a#'+partnerId).next('ul').length<1){
                                rel.delete_node(partnerId);
                            }
                            var id = $('#organization_treeH>ul>li>a:eq(0)').attr('id');
                            rel.select_node(id);
                        } else {
                            S_layer.error(response.info);
                        }
                    });

                }, function () {
                });
            });

        }
        //编辑事业合伙人
        ,aliasbPartner:function($obj,data){
            $obj.find('.tree-btn a[data-action="aliasbPartner"]').on('click',function(event) {
                var $btn = $(this);
                var options = {
                    companyId:data.companyId,
                    companyOriginalName:data.treeEntity.companyName,
                    companyAlias:data.text,
                    relationTypeId:data.relationType,
                    enterpriseId:data.enterpriseId,
                    type:data.type,
                    saveCallback:function(data){
                        //更新树节点属性
                        var tree = $('#organization_treeH').jstree(true), sel = tree.get_selected(true)[0];
                        tree.set_text(sel, data);
                        sel.original.treeEntity.companyName = data;
                        //$('#organization_treeH li#'+sel.id+' a').click();
                    }
                };

                $('body').m_org_partner_edit(options);

                return false;
            });
        }
        //添加部门
        , addDepart: function () {
            var that = this;
            var options = {};
            options.departObj = {};
            if (that._currTreeObj.companyId != null) {
                options.departObj.parentDepart = that._currTreeObj.treeEntity;
                options.departObj.parentDepart.departName = that._currTreeObj.text;
                options.departObj.parentDepart.companyId = that._currTreeObj.companyId;
                options.doType = 'add';
                options.saveCallBack = function (data) {
                    addNodeByTree(data, that._currTreeObj, that._currentCompanyId);
                    that.addTreeBtn(that._currTreeObj);
                };
                $('body').m_editDepart(options);
            } else {
                S_toastr.warning('请选择组织！');
            }
        }
        //添加人员
        , addUser: function () {
            var that = this;
            var options = {};
            if (that._currTreeObj.companyId != null) {
                options.companyId = that._currTreeObj.companyId;
                options.realId = that._currTreeObj.realId;
                $('body').m_editUser(options);
            } else {
                S_toastr.warning('请选择组织或部门！');
            }
        }
        //批量导入
        , bulkImport: function () {
            var option = {}, that = this;
            option.companyInfo = {};
            option.companyInfo.companyId = that._currTreeObj.companyId;

            if(that._currTreeObj.companyId == window.currentCompanyId){

                var tree = $('#organization_treeH').jstree(true), sel = tree.get_node('root');
                option.companyInfo.companyName = sel.text;
            }else{
                var tree = $('#organization_treeH').jstree(true), sel = tree.get_node(that._currTreeObj.companyId);
                option.companyInfo.companyName = sel.text;
            }

            $(that.element).m_bulkImport(option);
        }
        //编辑部门介绍
        , editDepartIntroduction: function () {
            var option = {}, that = this;
            option.companyInfo = {};
            option.companyInfo.companyId = that._currTreeObj.companyId;
            option.departId= that._currTreeObj.treeEntity.id;
            option.businessType= 2;
            if(that._currTreeObj.companyId == window.currentCompanyId){
                var tree = $('#organization_treeH').jstree(true), sel = tree.get_node('root');
                option.companyInfo.companyName = sel.text;
            }else{
                var tree = $('#organization_treeH').jstree(true), sel = tree.get_node(that._currTreeObj.companyId);
                option.companyInfo.companyName = sel.text;
            }

            $(that.element).m_editDepartIntroduction(option);
        }
        //事件绑定
        , bindActionClick: function () {
            var that = this;
            $(that.element).find('.headContent button[data-action],.headContent a[data-action], button[data-action="editDepartIntroduction"]').off('click').on('click', function () {
                var $this = $(this),dataAction = $this.attr('data-action');
                // if (dataAction == 'editDepart') {//编辑部门
                //     that.editDepart();
                //     return false;
                // }
                switch (dataAction){
                    case 'addDepart'://添加部门
                        that.addDepart();
                        break;
                    case 'addUser'://添加人员
                        that.addUser();
                        break;
                    case 'inviteUser'://邀请人员
                        $('body').m_inviteUser();
                        break;
                    case 'bulkImport'://批量导入
                        that.bulkImport();
                        break;
                    case 'deleteSubCompany'://删除分支机构
                        that.deleteSubCompany($(this));
                        break;

                    case 'addOrgType'://添加部门分类
                        $('body').m_org_type_edit({
                            saveCallBack : function (data) {
                                addNodeByTree(data, that._rootTreeObj, that._currentCompanyId,1);
                            }
                        });
                        break;
                    case 'editDepartIntroduction':
                        that.editDepartIntroduction();
                        break;
                }
                return false;


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
