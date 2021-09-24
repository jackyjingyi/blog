/**
 * 项目信息－生产安排专业详情
 * Created by wrb on 2020/01/10.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_production_member_task_tracking",
        defaults = {
            taskId:null,
            taskInfo:null,//专业任务详情
            projectId:null,
            projectName:null,
            dataCompanyId:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._dataInfo = {};//请求数据
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.renderContent();
        }

        //渲染内容
        ,renderContent:function () {
            var that = this;
            that.getBasicInfoData(function (data) {

                var html = template('m_production/m_production_member_task_tracking',{dataInfo:data});
                $(that.element).html(html);
                that.initICheck();
                that.editHoverFun();
                that.bindTrActionClick();
                that.bindEditable();

                //下拉按钮，外层浮窗展示，避免原浮窗导致panel出现横向滚动条
                $(that.element).find('.singleOperation button[data-toggle="dropdown"]').on('click',function () {
                    var $this = $(this);
                    var $html = $this.next().clone(true);
                    var content = $html.removeClass('hide').addClass('dp-block').prop('outerHTML');
                    $this.m_floating_popover({
                        content: content,
                        placement: 'bottomLeft',
                        popoverStyle:{'border':'0','box-shadow':'none'},
                        renderedCallBack: function ($popover) {
                            $popover.find('a[data-action]').on('click',function () {
                                var dataAction = $(this).attr('data-action');
                                $this.next().find('a[data-action="'+dataAction+'"]').click();
                                $this.m_floating_popover('closePopover');//关闭浮窗
                                return false;
                            });
                            $popover.hover(function () {
                                $this.parents('.singleOperation').show();
                            },function () {
                                $this.parents('.singleOperation').hide();
                                $this.m_floating_popover('closePopover');//关闭浮窗
                            });
                        }
                    }, true);
                });

            });
        }
        //获取基础数据
        ,getBasicInfoData:function (callBack) {
            var that = this;
            var options={};
            options.classId = '#content-right';
            options.url = restApi.url_listProductTaskByMember;
            options.postData = {};
            options.postData.id = that.settings.taskId;
            m_ajax.postJson(options,function (response) {

                if(response.code=='0'){

                    //所有任务列表放进childList,以便查找
                    that._dataInfo.childList =  [];
                    $.each(response.data,function (i,item) {
                        if(item.taskList){
                            that._dataInfo.childList = that._dataInfo.childList.concat(item.taskList)
                        }
                    });
                    if(callBack)
                        callBack(response.data);

                }else {
                    S_layer.error(response.info);
                }
            });
        }
        ,initICheck:function ($ele) {
            var that = this,isInitCheckAll = false;
            if(isNullOrBlank($ele)){
                $ele = $(that.element);
                isInitCheckAll = true
            }

            var ifChecked = function (e) {

                var $panel = $(this).closest('.panel');
                var ppath =  $(this).closest('tr').attr('data-path');
                $panel.find('tr.tree-box-tr').each(function () {
                    var path = $(this).attr('data-path');
                    if(path.indexOf(ppath)>-1 && path!=ppath){
                        $(this).find('input[name="taskCk"]').prop('checked',true);
                        $(this).find('input[name="taskCk"]').iCheck('update');
                        $(this).find('input[name="taskCk"]').iCheck('disable');
                    }else{
                        return true;
                    }
                });

                that.isTaskAllCheck($panel);

            };
            var ifUnchecked = function (e) {

                var $panel = $(this).closest('.panel');
                var ppath =  $(this).closest('tr').attr('data-path');
                $panel.find('tr.tree-box-tr').each(function () {
                    var path = $(this).attr('data-path');
                    if(path.indexOf(ppath)>-1){
                        $(this).find('input[name="taskCk"]').prop('checked',false);
                        $(this).find('input[name="taskCk"]').iCheck('update');
                        $(this).find('input[name="taskCk"]').iCheck('enable');
                    }else{
                        return true;
                    }
                });
                that.isTaskAllCheck($(this).closest('.panel'));
            };
            $ele.find('input[name="taskCk"]').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            }).on('ifUnchecked.s', ifUnchecked).on('ifChecked.s', ifChecked);

            if(!isInitCheckAll)
                return false;

            var ifAllChecked = function (e) {

                var dataType = '1';
                that._lastClickCheckBoxEle = $(this).closest('.panel').find('input[name="taskAllCk"]');
                var $ck = $(this).closest('.panel').find('input[name="taskCk"][data-is-can1="1"]');
                if($ck.length==0){
                    var warningStr = '';
                    switch (dataType){
                        case '1':
                            warningStr = '没有可删除任务';
                            break;
                    }
                    S_toastr.warning(warningStr);
                    var t = setTimeout(function () {
                        that._lastClickCheckBoxEle.iCheck('uncheck');
                        clearTimeout(t);
                    },500);
                    return false;
                }

                $(this).closest('.panel').find('input[name="taskCk"]').prop('checked',true);
                $(this).closest('.panel').find('input[name="taskCk"]').iCheck('update');
                $(this).closest('.panel').find('tr[data-pid!=""] input[name="taskCk"]').iCheck('disable');
                $(this).closest('.panel').find('input[name="taskCk"][data-is-can1="1"]').closest('tr').addClass('chose-operable');

            };
            var ifAllUnchecked = function (e) {
                $(this).closest('.panel').find('input[name="taskCk"]').prop('checked',false);
                $(this).closest('.panel').find('input[name="taskCk"]').iCheck('update');
                $(this).closest('.panel').find('tr[data-pid!=""] input[name="taskCk"]').iCheck('enable');
                $(this).closest('.panel').find('input[name="taskCk"]').closest('tr').removeClass('chose-operable');
            };
            var ifAllClicked = function (e) {

            };
            $ele.find('input[name="taskAllCk"]').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            }).on('ifUnchecked.s', ifAllUnchecked).on('ifChecked.s', ifAllChecked).on('ifClicked',ifAllClicked);
        }
        //判断全选是否该选中并给相关处理
        ,isTaskAllCheck:function ($panel) {

            $panel.find('input[name="taskAllCk"]').each(function () {
                var dataType = 1;
                var taskLen = $(this).closest('.panel').find('input[name="taskCk"][data-is-can'+dataType+'="1"]').length;
                var taskCheckedLen = $(this).closest('.panel').find('input[name="taskCk"][data-is-can'+dataType+'="1"]:checked').length;
                if(taskLen==taskCheckedLen && taskLen==taskCheckedLen!=0){
                    $panel.find('input[name="taskAllCk"]').prop('checked',true);
                    $panel.find('input[name="taskAllCk"]').iCheck('update');
                }else{
                    $panel.find('input[name="taskAllCk"]').prop('checked',false);
                    $panel.find('input[name="taskAllCk"]').iCheck('update');
                }
            });

        }
        //hover事件
        ,editHoverFun:function ($ele) {

            var that = this;
            if(isNullOrBlank($ele))
                $ele = $(that.element).find('tr');

            //文本移上去出现编辑图标hover事件
            $ele.find('a[data-action][data-deal-type="edit"],a[data-action="xeditable"],a[data-action="xeditableUser"],a[data-action="xeditableByClick"],a[data-action="stateFlow"]').each(function () {

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
            //TR hover效果
            $(that.element).find('TR').each(function () {

                var $this = $(this);
                var singleOperation = $this.find('.singleOperation');
                var batchOperation = $this.find('.batchOperation');

                $this.hover(function () {
                    if(batchOperation.length==0 || batchOperation.css('display')=='none'){
                        singleOperation.show();
                    }
                    if(!$this.hasClass('chose-operable')){
                        $this.addClass('tr-hover');
                    }

                },function () {
                    singleOperation.hide();
                    if(!$this.hasClass('chose-operable')){
                        $this.removeClass('tr-hover');
                    }
                });
            });

        }
        ,bindTrActionClick:function () {
            var that = this;
            $(that.element).find('a[data-action],button[data-action]').on('click', function (e) {
                var $this = $(this);
                var $panel = $this.closest('.panel');
                var dataAction = $this.attr('data-action');
                var dataPid = $this.closest('.panel').attr('data-id');
                var dataId = $this.closest('tr').attr('data-id');
                var dataI = $this.closest('tr').attr('data-i')-0;
                //获取节点数据
                var dataItem = getObjectInArray(that._dataInfo.childList,dataId);
                if(dataItem==null)
                    dataItem = {};

                switch (dataAction) {

                    case 'delTask'://删除任务
                        var idList = [];
                        idList.push(dataId);
                        that.batchDelTask(idList);
                        break;
                    case 'batchDelTask'://批量删除
                        var idList = [];
                        $panel.find('input[name="taskCk"][data-is-can1="1"]:checked').each(function () {
                            var id = $(this).closest('tr').attr('data-id');
                            idList.push(id);
                        });
                        if(idList.length>0){
                            that.batchDelTask(idList);
                        }else{
                            S_toastr.warning('当前不存在可删除的任务，请重新选择！');
                        }
                        break;
                    case 'stateFlow'://状态流转
                        var endStatus = $this.attr('data-end-status');
                        if(endStatus==5){
                            $('body').m_task_issue_approval({
                                projectId:that.settings.projectId,
                                taskId:dataId,
                                saveCallBack:function () {
                                    that.renderContent();
                                },
                                closeCallBack:function () {
                                    that.renderContent();
                                }
                            },true);
                        }else{
                            $('body').m_task_issue_status_flow({
                                dataInfo:dataItem,
                                doType:2,
                                saveCallBack:function () {
                                    that.renderContent();
                                }
                            },true);
                        }
                        break;
                    case 'expander'://折叠与展开

                        if($this.find('span').hasClass('ic-open')){
                            $this.find('span').removeClass('ic-open').addClass('ic-retract');
                        }else{
                            $this.find('span').addClass('ic-open').removeClass('ic-retract');
                        }
                        $this.closest('.panel').find('.panel-body').eq(0).slideToggle();
                        break;
                }

            });

        }
        //批量删除任务
        ,batchDelTask:function (idList) {
            var that = this;
            S_layer.confirm('删除后将不能恢复，您确定要删除吗？', function () {
                var option = {};
                option.url = restApi.url_deleteProjectTask;
                option.postData = {};
                option.postData.idList = idList;
                m_ajax.postJson(option, function (response) {
                    if (response.code == '0') {
                        S_toastr.success('删除成功！');
                        that.renderContent();
                    } else {
                        S_layer.error(response.info);
                    }
                });

            }, function () {
            });
        }
        //在位编辑内容初始化
        ,bindEditable:function($ele){
            var that = this;
            if(isNullOrBlank($ele))
                $ele = $(that.element);

            $ele.find('a[data-action="xeditable"]').each(function () {
                var $this = $(this);
                var key = $this.attr('data-key');
                var value = $this.attr('data-value');
                var dataInfo = null;
                $this.m_editable({
                    inline:true,
                    hideElement:true,
                    isNotSet:false,
                    value:value,
                    dataInfo:dataInfo,
                    postParam:{projectId:that.settings.projectId},
                    closed:function (data,$popover) {

                        if(data!=false){

                            var param = {};
                            param.id = $this.closest('tr').attr('data-id');
                            if(key=='taskName'){

                                param.companyId = $this.closest('tr').attr('data-company-id');

                            }else if(key=='startTime'){

                                param.isUpdateDate = 1;
                                param.endTime = $this.attr('data-max-date');

                            }else if(key=='endTime'){

                                param.isUpdateDate = 1;
                                param.startTime = $this.attr('data-min-date');

                            }
                            if(data[key]!=null){
                                param[key] = data[key];
                                that.saveTaskIssue(param);
                            }
                        }
                        $this.parent().find('.show-span').show();
                    },
                    completed:function ($popover) {
                        $('.show-span').show();
                        $this.parent().find('.show-span').hide();
                    }
                },true);
            });

            $(that.element).find('a[data-action="xeditableByClick"]').off('click').on('click',function () {
                var $this = $(this);
                var key = $this.attr('data-key');
                var value = $.trim($this.attr('data-value'));
                var id = $this.closest('tr').attr('data-id');
                var dataItem = getObjectInArray(that._dataInfo.childList,id);
                $('body').m_production_approval_opinion_state_flow({
                    doType:3,
                    dataInfo:dataItem,
                    projectId:that.settings.projectId,
                    saveCallBack:function () {
                        that.renderContent();
                    }
                },true);

            });


            $ele.find('a[data-action="xeditableUser"]').off('click').on('click',function () {
                var $this = $(this);
                var key = $this.attr('data-key');
                var value = [];
                var dataId = $this.closest('tr').attr('data-id');
                //获取节点数据
                var dataPidItem = that._dataInfo;
                var dataItem = getObjectInArray(dataPidItem.childList,dataId);
                var list = dataItem[key]?dataItem[key].userList:null;
                $.each(list,function (i,item) {
                    value.push({id:item.companyUserId,text:item.userName})
                });

                $this.m_editable_select_users({
                    value:value,
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
                            param.type = 1;
                            param.taskId = dataId;
                            param.companyUserList = getUserIdList(data);
                            that.editHandlerUser(param);
                            $this.m_editable_select_users('setCookiesByUsers', {userList: data});
                        }
                        $this.parent().find('.show-span').show();
                    },
                    completed:function ($popover) {
                        $('.show-span').show();
                        $this.parent().find('.show-span').hide();

                    }
                },true);
            });

        }
        //编辑签发保存
        ,saveTaskIssue:function (param) {
            var options={},that=this;
            options.url=restApi.url_updateProjectBaseData;
            options.classId = that.element;
            options.postData = {};
            $.extend(options.postData, param);
            m_ajax.postJson(options,function (response) {
                if(response.code=='0'){
                    S_toastr.success('保存成功！');
                    that.renderContent();
                }else {
                    if(response.info.indexOf('已存在')>-1){
                        S_toastr.error(response.info);
                    }else{
                        S_layer.error(response.info);
                    }
                }
            });
        }
        //保存处理人
        ,editHandlerUser:function(data,event){
            var that = this;
            var option={};
            option.url=restApi.url_saveProjectHandlerMember;
            option.classId = 'body';
            option.postData={};
            option.postData.targetId = data.taskId;
            option.postData.projectId=that.settings.projectId;
            option.postData.companyId=that._currentCompanyId;
            option.postData.type=data.type;
            option.postData.companyUserList=data.companyUserList;
            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){
                    S_layer.close($(event));
                    S_toastr.success('保存成功！');
                    that.renderContent();
                }else {
                    S_layer.error(response.info);
                }
            })
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
