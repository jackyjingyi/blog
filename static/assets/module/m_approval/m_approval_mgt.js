/**
 * 审批管理
 * Created by wrb on 2018/8/2.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_approval_mgt",
        defaults = {
            selectedOrg:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentUserId = window.currentUserId;
        this._currentCompanyId = window.currentCompanyId;

        this._selectedOrg = null;//当前组织筛选-选中组织对象
        this._dataList = [];
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_approval/m_approval_mgt',{});
            $(that.element).html(html);
            //that.initOrgSelect();
            that._selectedOrg = {id:that._currentCompanyId};
            that.render();
        }
        ,render:function () {
            var that = this;
            that.renderContent(function () {
                that.initICheck();
                that.bindActionClick();

                if(window.currentRoleCodes.indexOf('30000102')<0)
                    $(that.element).find('a[data-action="setCcUser"]').addClass('disabled').removeAttr('data-action');
            });
        }
        //渲染列表内容
        ,renderContent:function (callBack) {
            var that = this;
            var option = {};
            option.classId = '#content-right';
            option.url = restApi.url_listForm;
            option.postData = {};
            option.postData.accountId = that._currentUserId;
            option.postData.currentCompanyId = that._currentCompanyId;
            option.postData.companyId = that._selectedOrg.id;
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    that._dataList = response.data;
                    var html = template('m_approval/m_approval_mgt_content',{
                        approvalList:response.data,
                        editForm:response.extendData.editForm
                    });
                    $(that.element).find('#approvalManagement').html(html);
                    if(response.extendData.editForm=='1'){
                        $(that.element).find('button[data-action="addForm"],button[data-action="addGroup"],button[data-action="addNewForm"]').removeClass('hide');
                    }else{
                        $(that.element).find('button[data-action="addForm"],button[data-action="addGroup"],button[data-action="addNewForm"]').addClass('hide');
                    }

                    if(callBack)
                        callBack();

                } else {
                    S_layer.error(response.info);
                }
            })

        }
        //初始化iCheck
        ,initICheck:function () {
            var that = this;
            var ifChecked = function (e) {
            };
            var ifUnchecked = function (e) {
            };
            var ifClicked = function (e) {
                var param = {};
                if ($(this).is(':checked')) {
                    $(this).iCheck('uncheck');
                    param.status = 0;
                }else{
                    $(this).iCheck('check');
                    param.status = 1;
                }
                param.id = $(this).closest('tr').attr('data-id');
            };
            $(that.element).find('input[name^="iCheck"]').iCheck({
                checkboxClass: 'icheckbox_square-pink',
                radioClass: 'iradio_square-green'
            }).on('ifUnchecked.s', ifUnchecked).on('ifChecked.s', ifChecked).on('ifClicked',ifClicked);
        }
        ,initOrgSelect:function () {
            var that = this;
            $(that.element).find('#selectOrg').m_org_chose_byTree({
                type:4,
                param : {permissionCode:'300001'},
                selectedId:that.settings.selectedOrg?that.settings.selectedOrg.id:that._currentCompanyId,
                selectedCallBack:function (data,childIdList) {
                    that._selectedOrg = data;
                    that.render();
                }
            },true);
        }
        //排序
        ,setDynamicFormSeq:function (data) {
            var that = this;
            var option = {};
            option.classId = '#content-right';
            option.url = restApi.url_setDynamicFormSeq;
            option.postData = data;
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                   S_toastr.success('操作成功！');
                   that.render();

                } else {
                    S_layer.error(response.info);
                }
            })
        }
        //事件绑定
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('a[data-action],button[data-action]').off('click').on('click',function () {
                var $this = $(this);
                var dataAction = $this.attr('data-action');
                var dataId = $this.closest('tr').attr('data-id');
                var dataPid = $this.closest('tr').attr('data-pid');

                //获取节点数据
                var pidDataItem = null;
                var dataItem = null;
                if(!isNullOrBlank(dataPid))
                    pidDataItem = getObjectInArray(that._dataList,dataPid);

                if(!isNullOrBlank(dataId) && pidDataItem)
                    dataItem = getObjectInArray(pidDataItem.formList,dataId);

               switch (dataAction){
                   case 'setProcess':

                       var option = {};
                       option.key = $this.attr('data-key');
                       option.type = $this.attr('data-type');
                       option.formId = $this.closest('tr').attr('data-id');
                       option.name = dataItem.name;
                       option.isSystem = dataItem.isSystem;
                       option.selectedOrg = that._selectedOrg;
                       $(that.element).m_approval_mgt_setProcess(option,true);

                       break;

                   case 'addApproval'://添加审批

                       $('body').m_form_template_settings({
                           selectedOrg:that._selectedOrg,
                           saveCallBack:function () {
                               that.render();
                           }
                       },true);
                       break;
                   case 'editApproval'://编辑审批

                       $('body').m_form_template_settings({
                           type:1,
                           selectedOrg:that._selectedOrg,
                           id:dataItem.formId,
                           saveCallBack:function () {
                               that.render();
                           }
                       },true);
                       break;
                   case 'addGroup'://添加分组

                       $('body').m_approval_mgt_addGroup({
                           selectedOrg:that._selectedOrg,
                           saveCallBack:function () {
                               that.render();
                           }
                       },true);
                       break;
                   case 'editGroup'://编辑分组

                       $('body').m_approval_mgt_addGroup({
                           title:'编辑流程分类',
                           selectedOrg:that._selectedOrg,
                           dataInfo:pidDataItem,
                           saveCallBack:function () {
                               that.render();
                           }
                       },true);
                       break;
                   case 'delGroup'://删除分组

                       S_layer.confirm('删除后将不能恢复，您确定要删除吗？', function () {

                           var option = {};
                           option.url = restApi.url_deleteDynamicGroup ;
                           option.postData = {
                               id:dataPid
                           };
                           m_ajax.postJson(option, function (response) {
                               if (response.code == '0') {
                                   S_toastr.success('删除成功！');
                                   that.render();
                               } else {
                                   S_layer.error(response.info);
                               }
                           });

                       }, function () {
                       });
                       break;
                   case 'moveToGroup'://移动分组

                       var dataInfo = dataItem;
                       dataInfo.selectedGroupId = pidDataItem.id;
                       $('body').m_approval_mgt_moveToGroup({
                           dataInfo:dataInfo,
                           selectedOrg:that._selectedOrg,
                           saveCallBack:function () {
                               that.render();
                           }
                       },true);
                       break;
                   case 'sortDown'://向下排序

                       var data = {};
                       var $nextData = $this.closest('tr').next();
                       data.dynamicFromId1 = dataItem.id;
                       data.dynamicFromId2 = $nextData.attr('data-id');
                       data.seq1 = isNullOrBlank(dataItem.seq)?null:dataItem.seq;
                       data.seq2 = isNullOrBlank($nextData.attr('data-seq'))?null:$nextData.attr('data-seq');
                       that.setDynamicFormSeq(data);
                       break;
                   case 'sortUp'://向上排序

                       var data = {};
                       var $prevData = $this.closest('tr').prev();
                       data.dynamicFromId1 = dataItem.id;
                       data.dynamicFromId2 = $prevData.attr('data-id');
                       data.seq1 = isNullOrBlank(dataItem.seq)?null:dataItem.seq;
                       data.seq2 = isNullOrBlank($prevData.attr('data-seq'))?null:$prevData.attr('data-seq');
                       that.setDynamicFormSeq(data);
                       break;

                   case 'delApproval'://删除审批

                       S_layer.confirm('删除后将不能恢复，您确定要删除吗？', function () {

                           var option = {};
                           option.url = restApi.url_deleteDynamicForm ;
                           option.postData = {
                               id:dataId
                           };
                           m_ajax.postJson(option, function (response) {
                               if (response.code == '0') {
                                   S_toastr.success('删除成功！');
                                   that.render();
                               } else {
                                   S_layer.error(response.info);
                               }
                           });

                       }, function () {
                       });
                       break;
                   case 'whetherEnable'://是否启用

                       var option = {};
                       option.url = restApi.url_updateStatusDynamicForm ;
                       option.postData = {
                           id:dataId,
                           status:$this.attr('data-status')
                       };
                       m_ajax.postJson(option, function (response) {
                           if (response.code == '0') {
                               S_toastr.success('操作成功！');
                               that.render();
                           } else {
                               S_layer.error(response.info);
                           }
                       });
                       break;
                   case 'preview'://预览
                       $('body').m_form_template_preview({
                           selectedOrg : that._selectedOrg,
                           formId:$this.closest('tr').attr('data-form-id')
                       },true);
                       break;

                   case 'editForm':

                       $('body').m_approval_mgt_form_edit({
                           dataInfo:dataItem,
                           selectedOrg : that._selectedOrg,
                           saveCallBack:function () {
                               that.render();
                           }
                       });
                       break;
                   case 'addForm':

                       $('body').m_approval_mgt_form_edit({
                           selectedOrg : that._selectedOrg,
                           saveCallBack:function () {
                               that.render();
                           }
                       });
                       break;

                   case 'addNewForm'://创建新审批
                       $('body').m_approval_mgt_temp_select({
                           selectedOrg : that._selectedOrg,
                           saveCallBack:function () {
                               that.render();
                           }
                       });
                       break;

                }
                return false;

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
