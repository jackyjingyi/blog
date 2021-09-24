/**
 * 我的任务－校审
 * Created by wrb on 2020/02/27.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_task_approval_opinion",
        defaults = {
            status:null,//0=待办，1=已办
            projectId:null,//项目ID
            saveCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._dataInfo = {};

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;

            var options={};
            options.classId = '#content-right';
            options.url=restApi.url_listMyTaskForApprovalOpinion;
            options.postData = {
                status:that.settings.status,
                projectId:that.settings.projectId
            };
            m_ajax.postJson(options,function (response) {

                if(response.code=='0'){

                    that._dataInfo = response.data.data;
                    var html = template('m_task/m_task_approval_opinion',{
                        dataList:response.data.data,
                        doType:that.settings.doType
                    });
                    $(that.element).html(html);

                    that.initApprovalOpinionCkICheck();
                    that.editHover();
                    that.bindApprovalOpinionClick();
                    that.bindActionClick();

                }else {
                    S_layer.error(response.info);
                }
            });

        }
        ,initApprovalOpinionCkICheck:function () {
            var that = this;

            var　checkAll = function ($this) {

                var checkedLen = $(that.element).find('input[name="approvalOpinionCk"][value!=""]:checked').length;
                var taskLen = $(that.element).find('input[name="approvalOpinionCk"][value!=""]').length;
                if(checkedLen==taskLen){
                    $(that.element).find('input[name="approvalOpinionCk"][value=""]').prop('checked',true);
                    $(that.element).find('input[name="approvalOpinionCk"][value=""]').iCheck('update');
                }else{
                    $(that.element).find('input[name="approvalOpinionCk"][value=""]').prop('checked',false);
                    $(that.element).find('input[name="approvalOpinionCk"][value=""]').iCheck('update');
                }
            };
            var ifChecked = function (e) {

                var $this = $(this);
                if(isNullOrBlank($this.attr('value'))){//全选
                    $(that.element).find('input[name="approvalOpinionCk"][value!=""]').prop('checked',true);
                    $(that.element).find('input[name="approvalOpinionCk"][value!=""]').iCheck('update');
                }
                checkAll($this);
            };
            var ifUnchecked = function (e) {
                var $this = $(this);
                if(isNullOrBlank($this.attr('value'))){//全不选
                    $(that.element).find('input[name="approvalOpinionCk"][value!=""]').prop('checked',false);
                    $(that.element).find('input[name="approvalOpinionCk"][value!=""]').iCheck('update');
                }
                checkAll($this);
            };
            $(that.element).find('input[name="approvalOpinionCk"]').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            }).on('ifUnchecked.s', ifUnchecked).on('ifChecked.s', ifChecked);
        }
        //在位编辑内容初始化
        ,bindApprovalOpinionClick:function(){
            var that = this;
            $(that.element).find('a[data-action="xeditableByApprovalOpinion"]').each(function () {
                var $this = $(this),dataId = $this.closest('tr').attr('data-id');
                var key = $this.attr('data-key');
                var value = $.trim($this.attr('data-value'));
                var dataInfo = null;

                if(key=='severity'){

                    //1:致命，2：严重，3：一般，4：提示，5：建议
                    dataInfo = [
                        {id: 0, name: '空'},
                        {id: 1, name: '致命'},
                        {id: 2, name: '严重'},
                        {id: 3, name: '一般'},
                        {id: 4, name: '提示'},
                        {id: 5, name: '建议'}];

                    $.each(dataInfo,function (i,item) {
                        if(item.id==value)
                            item.isSelected = true;
                    });
                }

                $this.m_editable({
                    inline:true,
                    popoverClass : 'full-width',
                    hideElement:true,
                    value:value,
                    dataInfo:dataInfo,
                    isNotSet:false,
                    postParam:{projectId:that.settings.projectId},
                    targetNotQuickCloseArr:['select2-selection__choice','select2-search--dropdown','select2-search__field','select2-results__options','btn-edit'],
                    closed:function (data,$popover) {
                        if(data!=false){

                            var param = {};
                            param.id = $this.closest('tr').attr('data-id');
                            param.isUpdateExecuters = 0;
                            if(data[key]!=null){

                                param[key] = data[key];
                                that.saveApprovalOpinion(param);
                            }
                        }
                        $this.parent().find('.show-span').show();
                    },
                    completed:function ($popover) {
                        $(that.element).find('.show-span').show();
                        $this.parent().find('.show-span').hide();
                    }
                },true);
            });
            $(that.element).find('a[data-action="xeditableStatusByApprovalOpinion"]').off('click').on('click',function () {
                var $this = $(this);
                var dataId = $this.closest('tr').attr('data-id');
                var dataI = $this.closest('tr').attr('data-i');
                var dataPi = $this.closest('tr').attr('data-pi');
                var dataPPI = $this.closest('tr').attr('data-ppi');
                var dataItem = that._dataInfo[dataPPI].childList[dataPi].childList[dataI];

                $('body').m_production_approval_opinion_state_flow({
                    dataInfo:dataItem,
                    //handler:data,
                    projectId:that.settings.projectId,
                    saveCallBack:function () {
                        that.init();
                        if(that.settings.saveCallBack)
                            that.settings.saveCallBack();
                    }
                },true);
                return false;
            });
            $(that.element).find('a[data-action="xeditableUserByApprovalOpinion"]').off('click').on('click',function () {
                var $this = $(this);
                var key = $this.attr('data-key');
                var value = [];
                var dataId = $this.closest('tr').attr('data-id');
                var dataI = $this.closest('tr').attr('data-i');
                var dataPi = $this.closest('tr').attr('data-pi');
                var dataPPI = $this.closest('tr').attr('data-ppi');
                var dataItem = that._dataInfo[dataPPI].childList[dataPi].childList[dataI];

                if($this.parent().find('span.fc-v1-grey').length==0){//已设置
                    $.each(dataItem.executers,function (i,item) {
                        value.push({id:item.userId,text:item.userName});
                    });
                }
                $this.m_editable_select_users({
                    value:value,
                    isBaBieUserId:true,
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
                            param.isUpdateExecuters = 1;
                            param.id = dataId;
                            param.handler = getUserIdList(data).join(',');
                            that.saveApprovalOpinion(param);
                            $this.m_editable_select_users('setCookiesByUsers', {userList: data});
                        }
                        $this.parent().find('.show-span').show();
                    },
                    completed:function ($popover,userList) {
                        $('.show-span').show();
                        $this.parent().find('.show-span').hide();

                    }
                },true);
                return false;
            });

            $(that.element).find('table tbody tr[data-id]').on('click',function (e) {

                var $this = $(this);
                var flag1 = $(e.target).closest('.m-editable').length>0 || $(e.target).hasClass('.btn-edit');
                var flag2 = $(e.target).hasClass('.editable-click') || $(e.target).closest('.editable-click').length>0;
                var flag3 = $(e.target).hasClass('.list-action-box') || $(e.target).closest('.list-action-box').length>0;

                if(flag1 || flag2 || flag3)
                    return;

                if($(that.element).find('.m-editable').length>0)//当前存在编辑状态下
                    return;

                var param = {
                    fileId:$this.attr('data-file-id'),
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
            });
        }
        //保存校审意见
        ,saveApprovalOpinion:function (data) {
            var options={},that=this;

            options.url=restApi.url_saveApprovalOpinion;
            options.classId = '#content-right';
            options.postData = data;

            m_ajax.postJson(options,function (response) {

                if(response.code=='0'){
                    S_toastr.success('操作成功！');
                    that.init();
                    if(that.settings.saveCallBack)
                        that.settings.saveCallBack();

                }else {
                    S_layer.error(response.info);
                }
            })
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
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('a[data-action]').on('click',function (e) {
                var $this = $(this),dataAction = $this.attr('data-action');
                var dataId = $this.closest('tr').attr('data-id');
                switch (dataAction){

                    case 'deleteItem'://删除设计文件

                        S_layer.confirm('删除后将不能恢复，您确定要删除吗？', function () {
                            var option = {};
                            option.url = restApi.url_deleteApprovalOpinion;
                            option.postData = {};
                            option.postData.id = dataId;
                            m_ajax.postJson(option, function (response) {
                                if (response.code == '0') {
                                    S_toastr.success('删除成功！');
                                    that.init();
                                    if(that.settings.saveCallBack)
                                        that.settings.saveCallBack();
                                } else {
                                    S_layer.error(response.info);
                                }
                            });

                        }, function () {
                        });

                        return false;
                        break;
                    case 'batchStateFlow'://批量流转
                        var taskList = [],isSameState=true,stateStr='';
                        $(that.element).find('input[name="approvalOpinionCk"][value!=""]:checked').each(function (i) {
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
                            S_toastr.error('请选择需要批量流转的任务！');
                            return false;
                        }
                        if(isSameState==false){
                            S_layer.error('当前选择的内容，状态不一致，请重新选择要批量流转的内容！');
                            return false;
                        }

                        var $tr = $(that.element).find('tr[data-id="'+taskList[0]+'"]');
                        var dataI = $tr.attr('data-i');
                        var dataPi = $tr.attr('data-pi');
                        var dataPPI = $tr.attr('data-ppi');
                        var dataItem = that._dataInfo[dataPPI].childList[dataPi].childList[dataI];

                        $('body').m_production_approval_opinion_state_flow({
                            doType:1,
                            isBatch:true,
                            dataInfo:dataItem,
                            postParam:{idList:taskList},
                            postUrl:restApi.url_batchChangeOpinionStatus,
                            projectId:that.settings.projectId,
                            saveCallBack:function () {
                                that.init();
                            }
                        },true);
                        return false;
                        break;

                }
            });
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
