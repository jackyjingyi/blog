/**
 * 项目模板－自定义属性模板
 * Created by wrb on 2019/09/20.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_project_temp_edit",
        defaults = {
            title:null,
            isDialog:true,
            doType:null,//null=项目模板编辑，
            projectId:null,
            dataInfo:null,//dataInfo不为null,即编辑
            saveParam:null,//保存另外参数
            pid:null,
            type: 1,//（1：项目类型 - 业务项目，2.项目类型 - 研究项目，）
            typePath:null,//是否某类子集代表字符串 (6-1)
            relationId:null,
            saveCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentCompanyId = window.currentCompanyId;
        this._currentUserId = window.currentUserId;

        this._selectedItemList = [];//选择列表
        this._customItemList = [];//自定义列表

        this._title = '项目类型-业务项目';

        if(this.settings.type==2){
            this._title = '项目类型-创新研究';
        }

        this.settings.title = '编辑'+this._title;


        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;

            that.renderPage();
        },
        //初始化数据
        renderDialog:function (html,callBack) {
            var that = this;

            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title: that.settings.title||'编辑项信息',
                    area : '1000px',
                    content:html,
                    cancel:function () {
                    },
                    ok:function () {

                        //if(that._selectedItemList && that._selectedItemList.length>0){
                            that.save();
                        //}else{
                        //    S_toastr.error('请选择模板库');
                        //    return false;
                        //}
                    }

                },function(layero,index,dialogEle){//加载html后触发
                    that.settings.isDialog = index;//设置值为index,重新渲染时不重新加载弹窗
                    that.element = dialogEle;
                    if(callBack)
                        callBack();
                });

            }else{//不以弹窗编辑
                $(that.element).html(html);
                if(callBack)
                    callBack();
            }
        }
        //生成html
        ,renderPage:function () {
            var that = this;
            that.getData(function (data) {
                var html = template('m_project_temp/m_project_temp_edit',{
                    dataList: data,
                    type:that.settings.type,
                    doType:that.settings.doType,
                    typePath:that.settings.typePath
                });
                that.renderDialog(html,function () {
                    that.initICheck();
                    that.addProperty_validate();
                    that.bindActionClick();

                    if(that.settings.type==5){
                        that.renderUnitList();
                    }
                    if(that.settings.dataInfo){
                        $.each(that.settings.dataInfo,function (i,item) {

                            var $item = $(that.element).find('input[type="checkbox"][value="'+item.fieldName+'"]');
                            that._selectedItemList.push({
                                fieldName:item.fieldName,
                                unitName:item.unitName,
                                id:$item.attr('data-id')
                            });
                            if($item.length==0){
                                that._customItemList.push({
                                    fieldName:item.fieldName,
                                    unitName:item.unitName,
                                    id:item.relationId
                                });
                            }
                        });
                        that.renderCusItemList();
                        that.renderSelectedItemList();
                        //已选匹配checkbox选中
                        $(that.element).find('#selectItemBox .field-name').each(function () {
                            var fieldName = $(this).attr('data-field-name');
                            $(that.element).find('input[type="checkbox"][value="'+fieldName+'"]').prop('checked',true);
                            $(that.element).find('input[type="checkbox"][value="'+fieldName+'"]').iCheck('update');
                        });
                        that.checkItemAll(1);
                    }
                });
            });
        }
        //获取数据
        ,getData:function (callBack) {
            var that = this;
            var option = {};
            option.classId = '#content-right';
            option.url = restApi.url_listDefaultProperty;
            option.postData = {};

            if(!isNullOrBlank(that.settings.pid))
                option.postData.pid=that.settings.pid;

            option.postData.type = that.settings.type;
            option.postData.relationId = that.settings.relationId;

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    var resData = response.data;
                    if(callBack)
                        callBack(resData);
                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //渲染单位
        ,renderUnitList:function () {
            var that = this;
            var option = {};
            option.classId = '#content-right';
            option.url = restApi.url_listUnitName;
            option.postData = {};
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    var iHtml = '';
                    if(response.data){
                        $.each(response.data,function (i,item) {
                            if(!isNullOrBlank(item)){
                                iHtml += '<li><a href="javascript:void(0);" class="l-h-18">'+item+'</a></li>';
                            }
                        });
                        $(that.element).find('#unitList').html(iHtml);

                        $(that.element).find('#unitList a').on('click',function () {
                            var text = $.trim($(this).text());
                            $(that.element).find('input[name="unitName"]').val(text);
                        });
                    }

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //渲染自定义
        ,renderCusItemList:function () {
            var that = this;

            var html = template('m_project_temp/m_project_temp_edit_customize',{
                customItemList: that._customItemList,
                dataInfo:that.settings.dataInfo,
                type:that.settings.type
            });
            $(that.element).find('#customItemBox').html(html);
            that.initICheck($(that.element).find('#customItemBox'));
            $(that.element).find('[data-toggle="tooltip"]').tooltip({trigger:'hover'});

            //删除已加
            $(that.element).find('#customItemBox').find('a[data-action="delCusItem"]').on('click',function () {
                var fieldName = $(this).closest('.i-checks').find('input[name="cusItemCk"]').val();
                $(that.element).find('input[type="checkbox"][value="'+fieldName+'"]').iCheck('uncheck');
                delObjectInArray(that._customItemList,function (obj) {
                    return obj.fieldName == fieldName;
                });
                $(this).closest('.col-md-6').remove();
            });

        }
        //渲染自定义
        ,renderSelectedItemList:function () {
            var that = this;

            var html = template('m_project_temp/m_project_temp_edit_select',{
                selectedItemList: that._selectedItemList,
                dataInfo:that.settings.dataInfo,
                type:that.settings.type
            });
            $(that.element).find('#selectItemBox').html(html);
            that.bindSortable();
            $(that.element).find('[data-toggle="tooltip"]').tooltip({trigger:'hover'});

            //删除已选
            $(that.element).find('#selectItemBox').find('a[data-action="delSelectedItem"]').on('click',function () {
                var fieldName = $(this).prev('.field-name').attr('data-field-name');

                var $item = $(that.element).find('input[type="checkbox"][value="'+fieldName+'"]');

                if($item.length>0 && $item.is(':checked')){
                    $(that.element).find('input[type="checkbox"][value="'+fieldName+'"]').iCheck('uncheck');
                }else{

                    delObjectInArray(that._selectedItemList,function (obj) {
                        return obj.fieldName == fieldName;
                    });
                    $(this).closest('.list-group-item').remove();
                }
            });

        }
        //已选自定义属性排序拖拽
        ,bindSortable: function () {
            var that = this;
            var sortable = Sortable.create(document.getElementById('selectItemBox'), {
                animation: 200,
                handle: '.item-span',
                sort: true,
                dataIdAttr: 'data-sortId',
                ghostClass: 'my-sortable-ghost',
                chosenClass: 'my-sortable-chosen',
                dragClass: 'my-sortable-drag',
                onAdd: function (evt){ //拖拽时候添加有新的节点的时候发生该事件
                    //console.log('onAdd.foo:', [evt.item, evt.from]);
                },
                onUpdate: function (evt){ //拖拽更新节点位置发生该事件
                    //console.log('onUpdate.foo:', [evt.item, evt.from]);
                },
                onRemove: function (evt){ //删除拖拽节点的时候促发该事件
                    //console.log('onRemove.foo:', [evt.item, evt.from]);
                },
                onStart:function(evt){ //开始拖拽出发该函数
                    //console.log('onStart.foo:', [evt.item, evt.from]);
                },
                onSort:function(evt){ //发生排序发生该事件
                    //console.log('onSort.foo:', [evt.item, evt.from]);
                },
                onEnd: function(evt){ //拖拽完毕之后发生该事件
                    //console.log('onEnd.foo:', [evt.item, evt.from]);
                    //console.log(evt)
                }
            });
        }
        //绑定checkbox显示
        ,initICheck:function($ele){
            var that = this;
            if($ele==null)
                $ele = $(that.element);

            $ele.find('.i-checks').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            });

            $ele.find('input[name="itemCk"]').on('ifChecked', function(e){

                var $group = $(this).closest('.col-group');
                if($(this).attr('value')==''){
                    $group.find('input[name="itemCk"][value!=""]').iCheck('check');
                }else{
                    that.checkItemParent($group);

                    var fieldName = $(this).val();
                    var unitName = $(this).attr('data-unit');
                    var itemId = $(this).attr('data-id');

                    //没有选择，才处理
                    if($(that.element).find('#selectItemBox .list-group-item .field-name[data-field-name="'+fieldName+'"]').length==0){
                        that._selectedItemList.push({
                            fieldName:fieldName,
                            unitName:unitName,
                            id:itemId
                        });
                        that.renderSelectedItemList();
                    }
                }

                that.checkItemAll();
                return false;

            }).on('ifUnchecked', function(e){

                var $group = $(this).closest('.col-group');
                if($(this).attr('value')==''){
                    $(this).closest('.col-md-12').next().find('input[name="itemCk"]').iCheck('uncheck');
                }else{
                    that.checkItemParent($group);

                    var fieldName = $(this).val();
                    //有选择，才处理
                    if($(that.element).find('#selectItemBox .list-group-item .field-name[data-field-name="'+fieldName+'"]').length>0){
                        delObjectInArray(that._selectedItemList,function (obj) {
                            return obj.fieldName == fieldName;
                        });
                        that.renderSelectedItemList();
                    }

                    //专业上，存在同名，也去勾选
                    if($(that.element).find('input[type="checkbox"][value="'+fieldName+'"]').length>0){
                        $(that.element).find('input[type="checkbox"][value="'+fieldName+'"]').prop('checked',false);
                        $(that.element).find('input[type="checkbox"][value="'+fieldName+'"]').iCheck('update');
                    }

                }
                that.checkItemAll();
                return false;
            });

            $ele.find('input[name="cusItemCk"]').on('ifChecked', function(e){

                    var fieldName = $(this).val();
                    var unitName = $(this).attr('data-unit');
                    that._selectedItemList.push({
                        fieldName:fieldName,
                        unitName:unitName
                    });
                    that.renderSelectedItemList();

                return false;

            }).on('ifUnchecked', function(e){

                var fieldName = $(this).val();
                delObjectInArray(that._selectedItemList,function (obj) {
                    return obj.fieldName == fieldName;
                });
                that.renderSelectedItemList();

                return false;
            });
            $ele.find('input[name="allItemCK"]').on('ifChecked', function(e){


                $(that.element).find('input[name="itemCk"]').iCheck('check');
                return false;

            }).on('ifUnchecked', function(e){

                $(that.element).find('input[name="itemCk"]').iCheck('uncheck');

                return false;
            });

        }
        //全选判断
        ,checkItemAll:function (type) {
            var that = this;
            var itemLen = $(that.element).find('input[name="itemCk"]').length;
            var itemCheckLen = $(that.element).find('input[name="itemCk"]:checked').length;
            if(itemLen==itemCheckLen){
                $(that.element).find('input[name="allItemCK"]').prop('checked',true);
                $(that.element).find('input[name="allItemCK"]').iCheck('update');
            }else{
                $(that.element).find('input[name="allItemCK"]').prop('checked',false);
                $(that.element).find('input[name="allItemCK"]').iCheck('update');
            }

            //追加二级checkbox 父级全选
            if(type==1){
                $(that.element).find('.col-group').each(function (i) {
                    var $group = $(this);
                    that.checkItemParent($group);
                });
            }

        }
        //针对专业设置，有二级checkbox,父级全选
        ,checkItemParent:function ($group) {
            var itemLen = $group.find('input[name="itemCk"][value!=""]').length;
            var itemCheckLen = $group.find('input[name="itemCk"][value!=""]:checked').length;
            if(itemLen==itemCheckLen){
                $group.find('input[name="itemCk"][value=""]').prop('checked',true);
                $group.find('input[name="itemCk"][value=""]').iCheck('update');
            }else{
                $group.find('input[name="itemCk"][value=""]').prop('checked',false);
                $group.find('input[name="itemCk"][value=""]').iCheck('update');
            }
        }
        //转换单位格式
        ,conversionUnitFormat:function (unitName) {

            var that = this,_unitName = '';
            switch(unitName){
                case 'm²':
                    _unitName = 'm&sup2;';
                    break;
                case 'm³':
                    _unitName = 'm&sup3;';
                    break;
                default:
                    _unitName = unitName;
                    break;
            }
            return _unitName;
        }
        //保存
        ,save:function () {
            var that = this;
            var option = {};
            option.classId = '#content-right';
            option.url = restApi.url_saveProjectTemplateList;
            option.postData = {};

            var dealData = function (doType) {
                var dataList = [];
                $(that.element).find('#selectItemBox .item-span .field-name').each(function (i) {

                    var dataId = $(this).attr('data-id');
                    var fieldName = $(this).attr('data-field-name');
                    var unitName = null;
                    if(that.settings.type==5)
                        unitName = $(this).attr('data-unit-name');

                    var data = {};
                    data.fieldName = fieldName;

                    if(!isNullOrBlank(unitName))
                        data.unitName = that.conversionUnitFormat(unitName);

                    //模板Id
                    if(!isNullOrBlank(dataId))
                        data.contentTypeId = dataId;

                    //匹配记录ID
                    if(that.settings.dataInfo){
                        $.each(that.settings.dataInfo,function (i,item) {
                            if(item.fieldName==data.fieldName){
                                data.id = item.id;
                                if(doType==5)
                                    data.fieldValue = item.fieldValue;

                            }
                        });
                    }
                    dataList.push(data);

                });

                return dataList;
            };
            option.postData.fieldNameList = dealData();
            option.postData.type=that.settings.type;
            option.postData.pid=that.settings.pid;

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    S_toastr.success('操作成功');
                    if(that.settings.saveCallBack)
                        that.settings.saveCallBack(option.postData);
                } else {
                    S_layer.error(response.info);
                }
            });
        }
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('button[data-action]').off('click').on('click',function () {
                var $this = $(this),dataAction = $this.attr('data-action');

                switch (dataAction){
                    case 'addItem'://添加自定义

                        if($(that.element).find('form#addItemForm').valid()){

                            var fieldName = $(this).parents('.row').find('input[name="fieldName"]').val();
                            var unitName = $(this).parents('.row').find('input[name="unitName"]').val();

                            that._customItemList.push({
                                fieldName:fieldName,
                                unitName:unitName
                            });
                            that.renderCusItemList();

                            that._selectedItemList.push({
                                fieldName:fieldName,
                                unitName:unitName
                            });
                            $(that.element).find('input[name="fieldName"]').val('');
                            that.renderSelectedItemList();
                        }

                        //已选匹配checkbox选中
                        $(that.element).find('#selectItemBox .field-name').each(function () {
                            var fieldName = $(this).attr('data-field-name');
                            $(that.element).find('input[type="checkbox"][value="'+fieldName+'"]').prop('checked',true);
                            $(that.element).find('input[type="checkbox"][value="'+fieldName+'"]').iCheck('update');
                        });
                        break;

                    case 'moreItem'://更多

                        if($this.find('i').hasClass('fa-angle-down')){
                            $this.parents('.row').find('.more-item').removeClass('hide');
                            $this.find('i').removeClass('fa-angle-down').addClass('fa-angle-up');
                            $this.find('span').text('收起');
                        }else{
                            $this.parents('.row').find('.more-item').addClass('hide');
                            $this.find('i').addClass('fa-angle-down').removeClass('fa-angle-up');
                            $this.find('span').text('更多');
                        }

                        break;
                }

            });
        }
        //添加自定义属性验证
        ,addProperty_validate: function () {
            var that = this;
            $('form#addItemForm').validate({
                rules: {
                    fieldName: {
                        required: true,
                        isReName: true
                    }
                },
                messages: {
                    fieldName: {
                        required: '名称不可为空！',
                        isReName: "该名称已存在，请勿重复添加"

                    }
                },
                errorPlacement: function (error, element) { //指定错误信息位置
                    element.closest('.row').find('.col-md-12').html(error);
                }
            });
            // 重名验证
            jQuery.validator.addMethod("isReName", function (value, element) {

                value = $.trim(value);
                var isOk = true;

                if($(that.element).find('input[type="checkbox"][value="'+value+'"]').length>0){
                    isOk = false;
                }
                return  isOk;

            }, "该名称已存在，请勿重复添加");

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


